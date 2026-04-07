import { userModel } from "../modules/auth/user/user.models";
import { razopayconfig } from "../config/razorpay";
import { verifypatmentdetails, bookingdetails } from "./payments.type";
import { db } from "../config/db";
import crypto from "crypto";
import { redis } from "../config/redis";
import {bookingemailqueue,failedpaymetqueue}  from "../queues/index";

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
        paymentdetails: verifypatmentdetails,
        bookingdetails: bookingdetails
    ) {
        // Step 1 — Check Redis reservation
        const verify = await redis.get(`slot_${bookingdetails.id}`);
        if (!verify || verify !== bookingdetails.userId.toString()) {
            await failedpaymetqueue.add("failedPayment", {
                email: bookingdetails.email,
                turfName: bookingdetails.turfName,
                amount: paymentdetails.amount,
                reason: "Slot reservation expired",
                razorpay_order_id: paymentdetails.razorpay_order_id,
                userId: bookingdetails.userId
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
            await failedpaymetqueue.add("failedPayment", {
                email: bookingdetails.email,
                turfName: bookingdetails.turfName,
                amount: paymentdetails.amount,
                reason: "Payment signature verification failed",
                razorpay_order_id: paymentdetails.razorpay_order_id,
                userId: bookingdetails.userId
            });
            throw new Error("Payment verification failed");
        }

        // Step 3 — Single atomic transaction
        const booking = await db.transaction().execute(async (trx) => {

            // Re-validate slot inside transaction
            const slot = await trx
                .selectFrom("slots")
                .selectAll()
                .where("id", "=", bookingdetails.id)
                .where("is_booked", "=", false)
                .executeTakeFirst();

            if (!slot) {
                await failedpaymetqueue.add("failedPayment", {
                    email: bookingdetails.email,
                    turfName: bookingdetails.turfName,
                    amount: paymentdetails.amount,
                    reason: "Slot no longer available",
                    razorpay_order_id: paymentdetails.razorpay_order_id,
                    userId: bookingdetails.userId
                });
                throw new Error("Slot no longer available");
            }

            // Mark slot as booked
            await trx
                .updateTable("slots")
                .set({ is_booked: true })
                .where("id", "=", bookingdetails.id)
                .execute();

            // Create booking
            const booking = await trx
                .insertInto("bookings")
                .values({
                    slot_id: bookingdetails.id,
                    turf_id: bookingdetails.turfId,
                    user_id: bookingdetails.userId,
                    status: "confirmed",
                } as any)
                .returningAll()
                .executeTakeFirstOrThrow();

            // Record successful payment
            await trx
                .insertInto("payments")
                .values({
                    booking_id: booking.id,
                    user_id: bookingdetails.userId,
                    razorpay_order_id: paymentdetails.razorpay_order_id,
                    razorpay_payment_id: paymentdetails.razorpay_payment_id,
                    amount: paymentdetails.amount,
                    payment_status: "success",
                } as any)
                .execute();

            return booking;
        });

        // Step 4 — Clear Redis AFTER transaction succeeds
        await redis.del(`slot_${bookingdetails.id}`);

        // Step 5 — Queue confirmation email
        await bookingemailqueue.add('bookingConfirmation', {
            email: bookingdetails.email,
            turfName: bookingdetails.turfName,
            slotTime: bookingdetails.slotTime,
            amount: paymentdetails.amount,
            bookingId: booking.id
        });

        return booking;
    },
};