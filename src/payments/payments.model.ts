import { db } from "../config/db";

export const paymentmodel = {
    async createpayment(userid:number,bookingid:number,razorpay_payment_id:string,razorpay_order_id:string,payment_method:string,payment_status:string){
        return await db.insertInto("payments").values({
            user_id:userid,
            booking_id:bookingid,
            razorpay_payment_id:razorpay_payment_id,
            razorpay_order_id:razorpay_order_id,
            payment_method:payment_method,
            payment_status:payment_status
        } as any).returningAll().executeTakeFirstOrThrow();
     }  
}