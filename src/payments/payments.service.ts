import { userModel } from "../modules/auth/user/user.models";
import { razopayconfig } from "../config/razorpay";
import { VerifyPaymentDetails, BookingDetails } from "./payments.type";
import { db } from "../config/db";
import crypto from "crypto";
import { redis } from "../config/redis";
import { bookingemailqueue, failedPaymentQueue, adminNotificationQueue } from "../queues/index";
import {generateReceipt} from "../utils/pdfkit";
export const paymentservices = {

    async createorder(turfId: number, slotId: number, userId: number) {

        // Check turf exists
        const turf = await userModel.findTurfById(turfId);
        if (!turf) throw new Error("Turf not found");

        // Check Redis — already reserved?
        const existingslot = await redis.get(`slot_${slotId}`);
        if (existingslot) {
            throw new Error("Slot already reserved, try another one");
        }

        // Check DB — slot exists and belongs to turf?
        const slot = await userModel.findSlotsBySlotId(slotId, turfId);
        if (!slot) throw new Error("Slot not available");

        // Reserve in Redis for 10 mins
        await redis.setex(`slot_${slotId}`, 600, userId.toString());

        // Create Razorpay order
        const createorder = await razopayconfig.orders.create({
            amount: turf.price_per_hour * 100,
            currency: "INR",
            receipt: `receipt_${userId}_${Date.now()}`,
        });

        return {
            orderId: createorder.id,
            amount: createorder.amount,
            currency: createorder.currency,
            keyId: process.env.RAZORPAY_KEY_ID,
        };
    },

    async verifypayment(
        paymentdetails: VerifyPaymentDetails,
        bookingCtx: BookingDetails
    ) {
        // Step 1 — Check Redis reservation
        const verify = await redis.get(`slot_${bookingCtx.slotId}`);
        if (!verify || verify !== bookingCtx.userId.toString()) {
            await failedPaymentQueue.add("failedPayment", {
                email: bookingCtx.email,
                turfName: bookingCtx.turfName,
                amount: paymentdetails.amount,
                reason: "Slot reservation expired",
                razorpay_order_id: paymentdetails.razorpay_order_id,
                userId: bookingCtx.userId
            });
            throw new Error("Slot reservation expired, try booking again");
        }

        // Step 2 — Verify signature BEFORE transaction
        const body = paymentdetails.razorpay_order_id + "|" + paymentdetails.razorpay_payment_id;
        const expectedsignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET as string)
            .update(body)
            .digest("hex");

        if (expectedsignature !== paymentdetails.razorpay_signature) {
            await failedPaymentQueue.add("failedPayment", {
                email: bookingCtx.email,
                turfName: bookingCtx.turfName,
                amount: paymentdetails.amount,
                reason: "Payment signature verification failed",
                razorpay_order_id: paymentdetails.razorpay_order_id,
                userId: bookingCtx.userId
            });
            throw new Error("Payment verification failed");
        }

        // Step 2b — Confirm payment with Razorpay (amount + order binding)
        let amountPaise: number;
        try {
            const rpPayment = await razopayconfig.payments.fetch(
                paymentdetails.razorpay_payment_id
            );
            if (rpPayment.order_id !== paymentdetails.razorpay_order_id) {
                await failedPaymentQueue.add("failedPayment", {
                    email: bookingCtx.email,
                    turfName: bookingCtx.turfName,
                    amount: paymentdetails.amount,
                    reason: "Payment does not match order",
                    razorpay_order_id: paymentdetails.razorpay_order_id,
                    userId: bookingCtx.userId,
                });
                throw new Error("Payment does not match order");
            }
            const st = rpPayment.status;
            if (st !== "captured" && st !== "authorized") {
                await failedPaymentQueue.add("failedPayment", {
                    email: bookingCtx.email,
                    turfName: bookingCtx.turfName,
                    amount: paymentdetails.amount,
                    reason: `Payment status: ${st}`,
                    razorpay_order_id: paymentdetails.razorpay_order_id,
                    userId: bookingCtx.userId,
                });
                throw new Error("Payment not completed");
            }
            amountPaise = Number(rpPayment.amount);
            if (Number(paymentdetails.amount) !== amountPaise) {
                await failedPaymentQueue.add("failedPayment", {
                    email: bookingCtx.email,
                    turfName: bookingCtx.turfName,
                    amount: paymentdetails.amount,
                    reason: "Amount mismatch with Razorpay",
                    razorpay_order_id: paymentdetails.razorpay_order_id,
                    userId: bookingCtx.userId,
                });
                throw new Error("Amount mismatch");
            }
        } catch (err) {
            const rethrow =
                err instanceof Error &&
                (err.message === "Payment does not match order" ||
                    err.message === "Payment not completed" ||
                    err.message === "Amount mismatch");
            if (rethrow) throw err;
            await failedPaymentQueue.add("failedPayment", {
                email: bookingCtx.email,
                turfName: bookingCtx.turfName,
                amount: paymentdetails.amount,
                reason: "Razorpay payment lookup failed",
                razorpay_order_id: paymentdetails.razorpay_order_id,
                userId: bookingCtx.userId,
            });
            throw new Error("Could not verify payment with Razorpay");
        }

        // Step 3 — Single atomic transaction
        const booking = await db.transaction().execute(async (trx) => {


            const slot = await trx
                .selectFrom("slots")
                .selectAll()
                .where("id", "=", bookingCtx.slotId)
                .where("is_booked", "=", false)
                .executeTakeFirst();

            if (!slot) {
                await failedPaymentQueue.add("failedPayment", {
                    email: bookingCtx.email,
                    turfName: bookingCtx.turfName,
                    amount: paymentdetails.amount,
                    reason: "Slot no longer available",
                    razorpay_order_id: paymentdetails.razorpay_order_id,
                    userId: bookingCtx.userId
                });
                throw new Error("Slot no longer available");
            }

            if (slot.turf_id !== bookingCtx.turfId) {
                await failedPaymentQueue.add("failedPayment", {
                    email: bookingCtx.email,
                    turfName: bookingCtx.turfName,
                    amount: paymentdetails.amount,
                    reason: "Turf does not match slot",
                    razorpay_order_id: paymentdetails.razorpay_order_id,
                    userId: bookingCtx.userId,
                });
                throw new Error("Turf does not match slot");
            }

            // Mark slot as booked
            await trx
                .updateTable("slots")
                .set({ is_booked: true })
                .where("id", "=", bookingCtx.slotId)
                .execute();

            // Create booking
            const booking = await trx
                .insertInto("bookings")
                .values({
                    slot_id: bookingCtx.slotId,
                    turf_id: slot.turf_id,
                    user_id: bookingCtx.userId,
                    status: "confirmed",
                } as any)
                .returningAll()
                .executeTakeFirstOrThrow();

            // Record successful payment
            const recipturl = await generateReceipt({
                bookingId: booking.booking_id,
                userEmail: bookingCtx.email,
                turfName: bookingCtx.turfName,
                slotTime: bookingCtx.slotTime,
                amount: amountPaise / 100,
                paymentdetails:paymentdetails.razorpay_payment_id
            }as any);
            await trx
                .insertInto("payments")
                .values({
                    booking_id: booking.booking_id,
                    user_id: bookingCtx.userId,
                    razorpay_order_id: paymentdetails.razorpay_order_id,
                    razorpay_payment_id: paymentdetails.razorpay_payment_id,
                    amount: amountPaise,
                    payment_status: "success",
                    recipturl: recipturl
                } as any)
                .execute();

            return booking;
        });
        

        // Step 4 — Clear Redis AFTER transaction succeeds
        await redis.del(`slot_${bookingCtx.slotId}`);

        // Step 5 — Queue confirmation email
        await bookingemailqueue.add('bookingConfirmation', {
            email: bookingCtx.email,
            turfName: bookingCtx.turfName,
            slotTime: bookingCtx.slotTime,
            amount: amountPaise,
            bookingId: booking.booking_id,
        });
        const admin = await db
            .selectFrom("users")
            .innerJoin("turfinfo", "turfinfo.created_by", "users.id")
            .select(["users.email"])
            .where("turfinfo.id", "=", bookingCtx.turfId)
            .executeTakeFirst();
        await adminNotificationQueue.add("newBooking", {
            turfname: bookingCtx.turfName,
            slotTime: bookingCtx.slotTime,
            amount: amountPaise,
            bookingId: booking.booking_id,
            email: admin?.email
        })
        return booking;
    },
};