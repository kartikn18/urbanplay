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
        // Store expected order context in Redis to verify without Razorpay fetch (avoids timeout).
        // TTL slightly longer than the slot hold.
        try {
            await redis.setex(
                `order_${createorder.id}`,
                900,
                JSON.stringify({
                    turfId,
                    slotId,
                    userId,
                    amount: Number(createorder.amount),
                    currency: createorder.currency,
                }),
            );
        } catch (e) {
            console.error("Could not persist order context to Redis:", e);
        }
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
        // Idempotency: if we already recorded this payment_id for this user, return the booking.
        const existing = await db
            .selectFrom("payments")
            .innerJoin("bookings", "bookings.booking_id", "payments.booking_id")
            .select([
                "bookings.booking_id",
                "bookings.user_id",
                "bookings.slot_id",
                "bookings.turf_id",
                "bookings.status",
                "bookings.created_at",
            ])
            .where("payments.razorpay_payment_id", "=", paymentdetails.razorpay_payment_id)
            .where("payments.user_id", "=", bookingCtx.userId)
            .executeTakeFirst();
        if (existing) return existing as any;

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

        // Step 2b — Validate expected amount/order context from Redis (no Razorpay fetch).
        let amountPaise: number | null = null;
        try {
            const raw = await redis.get(`order_${paymentdetails.razorpay_order_id}`);
            if (raw) {
                const parsed = JSON.parse(raw) as {
                    turfId: number;
                    slotId: number;
                    userId: number;
                    amount: number;
                    currency?: string;
                };

                if (
                    parsed.userId !== bookingCtx.userId ||
                    parsed.slotId !== bookingCtx.slotId ||
                    parsed.turfId !== bookingCtx.turfId
                ) {
                    await failedPaymentQueue.add("failedPayment", {
                        email: bookingCtx.email,
                        turfName: bookingCtx.turfName,
                        amount: paymentdetails.amount,
                        reason: "Order context mismatch in Redis",
                        razorpay_order_id: paymentdetails.razorpay_order_id,
                        userId: bookingCtx.userId,
                    });
                    throw new Error("Order context mismatch");
                }

                if (parsed.currency && parsed.currency !== "INR") {
                    await failedPaymentQueue.add("failedPayment", {
                        email: bookingCtx.email,
                        turfName: bookingCtx.turfName,
                        amount: paymentdetails.amount,
                        reason: "Currency mismatch in Redis order data",
                        razorpay_order_id: paymentdetails.razorpay_order_id,
                        userId: bookingCtx.userId,
                    });
                    throw new Error("Currency mismatch");
                }

                amountPaise = Number(parsed.amount);
            }
        } catch (e) {
            // If Redis is unavailable or JSON parse fails, we'll fallback to DB computation below.
            console.error("Could not read/parse order context from Redis:", e);
        }

        if (amountPaise == null || !Number.isFinite(amountPaise) || amountPaise <= 0) {
            // Fallback: compute from DB (less ideal if price changes, but prevents false failures)
            const turf = await userModel.findTurfById(bookingCtx.turfId);
            if (!turf) throw new Error("Turf not found");
            amountPaise = Number(turf.price_per_hour) * 100;
        }

        if (Number(paymentdetails.amount) !== Number(amountPaise)) {
            await failedPaymentQueue.add("failedPayment", {
                email: bookingCtx.email,
                turfName: bookingCtx.turfName,
                amount: paymentdetails.amount,
                reason: "Amount mismatch with server expectation",
                razorpay_order_id: paymentdetails.razorpay_order_id,
                userId: bookingCtx.userId,
            });
            throw new Error("Amount mismatch");
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
            const receiptUrl = await generateReceipt({
                bookingId: booking.booking_id,
                userEmail: bookingCtx.email,
                turfName: bookingCtx.turfName,
                slotTime: bookingCtx.slotTime,
                amountPaise,
                paymentId: paymentdetails.razorpay_payment_id,
            });
            await trx
                .insertInto("payments")
                .values({
                    booking_id: booking.booking_id,
                    user_id: bookingCtx.userId,
                    razorpay_order_id: paymentdetails.razorpay_order_id,
                    razorpay_payment_id: paymentdetails.razorpay_payment_id,
                    amount: amountPaise,
                    payment_status: "success",
                    recipts_url: receiptUrl,
                } as any)
                .execute();

            return booking;
        });
        

        // Step 4/5 — Post-transaction side effects (must not flip a successful payment to "failed")
        // If any of these fail (Redis/queues), the booking is still confirmed.
        try {
            await redis.del(`slot_${bookingCtx.slotId}`);
        } catch (e) {
            console.error("Post-payment cleanup failed (redis.del):", e);
        }
        try {
            await redis.del(`order_${paymentdetails.razorpay_order_id}`);
        } catch (e) {
            console.error("Post-payment cleanup failed (redis.del order context):", e);
        }

        try {
            await bookingemailqueue.add('bookingConfirmation', {
                email: bookingCtx.email,
                turfName: bookingCtx.turfName,
                slotTime: bookingCtx.slotTime,
                amount: amountPaise,
                bookingId: booking.booking_id,
            });
        } catch (e) {
            console.error("Post-payment side effect failed (booking email queue):", e);
        }

        try {
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
            });
        } catch (e) {
            console.error("Post-payment side effect failed (admin notification queue):", e);
        }
        return booking;
    },
};