import { userModel } from "../modules/auth/user/user.models";
import { razopayconfig } from "../config/razorpay";
import { verifypatmentdetails, bookingdetails } from "./payments.type";
import { db } from "../config/db";
import crypto from "crypto";                    
export const paymentservices = {

  async createorder(turfId: number, slotId: number, userId: number) {

    // Check turf exists
    const turf = await userModel.findturfbyId(turfId);
    if (!turf) throw new Error("Turf not found");

    // Check slot exists and not already booked
    const slot = await userModel.findslotsbySlotId(slotId);
    if (!slot) throw new Error("Slot not found");
    if (slot.is_booked) throw new Error("Slot already booked");

    // Create Razorpay order
    const createorder = await razopayconfig.orders.create({
      amount: turf.price_per_hour * 100,        // paise
      currency: "INR",
      receipt: `receipt_${userId}_${Date.now()}`, // ✅ unique receipt
    });

    return {
      orderId: createorder.id,
      amount: createorder.amount,               // ✅ from razorpay not input
      currency: createorder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    };
  },

  async verifypayment(
    paymentdetails: verifypatmentdetails,
    bookingdetails: bookingdetails
  ) {

    // Step 1 — Verify signature
    const body =
      paymentdetails.razorpay_order_id + "|" + paymentdetails.razorpay_payment_id;

    const expectedsignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET as string)
      .update(body)
      .digest("hex");

    if (expectedsignature !== paymentdetails.razorpay_signature) {
      throw new Error("Payment verification failed");
    }

    // Step 2 — Transaction (all or nothing)
    return await db.transaction().execute(async (trx) => {

      // Mark slot as booked
      await trx
        .updateTable("slots")
        .set({ is_booked: true })
        .where("id", "=", bookingdetails.id)
        .execute();

      // Create booking record
      const booking = await trx
        .insertInto("bookings")
        .values({
          slot_id: bookingdetails.id,
          turf_id: bookingdetails.turfId,
          user_id: bookingdetails.userId,
          status: "booked",
        }as any)
        .returningAll()
        .executeTakeFirstOrThrow();

      await trx
        .insertInto("payments")
        .values({
          booking_id: booking.id,
          user_id: bookingdetails.userId,
          razorpay_order_id: paymentdetails.razorpay_order_id,
          razorpay_payment_id: paymentdetails.razorpay_payment_id,
          amount: paymentdetails.amount,
          payment_status: "success",
        }as any)
        .execute();

      return booking;
    });
  },
};