import { userModel } from "../modules/auth/user/user.models";
import { razopayconfig } from "../config/razorpay";
import { verifypatmentdetails, bookingdetails } from "./payments.type";
import { db } from "../config/db";
import crypto from "crypto";    
import {redis} from "../config/redis"                
export const paymentservices = {

  async createorder(turfId: number, slotId: number, userId: number) {
const turf = await userModel.findTurfById(turfId);
if(!turf){
    throw new Error("turf not found");
}
    // Check slots exists
   const existingslot = await redis.get(`slot_${slotId}`);
   if(existingslot){
    throw new Error("slot already reserved, try another one");
   }
   const slot = await userModel.findSlotsBySlotId(slotId,turfId);
   if(!slot){
    throw new Error("slot not available");
   }
  await redis.setex(
    `slot_${slotId}`,
    600,// 10 min expiration
    userId.toString()
  )
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
    const verify = await redis.get(`slot_${bookingdetails.id}`);
    if(!verify || verify !== bookingdetails.userId.toString()){
        throw new Error("slot reservation expired, try booking again");
    }
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
        // delete the redis key after successful booking
        await redis.del(`slot_${bookingdetails.id}`);

      return booking;
    });
  },
};