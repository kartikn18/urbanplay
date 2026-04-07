import {Request, Response,NextFunction} from "express";
import { paymentservices } from "./payments.service";
import{db} from "../config/db";
export const createorder = async(req:Request,res:Response,next:NextFunction)=>{
    const id = req.user?.id;// from JWT middleware
    const turfid = req.params.turfId as unknown as number;
    const slotId = req.params.slotId as unknown as number;
    try {
        const order = await paymentservices.createorder(turfid,slotId,id!);
        res.status(200).json({
            message:"Order created successfully",
            data:order
        })
    } catch (error) {
        next(error);
    };

}

export const verifypayments = async(req:Request,res:Response)=>{
    const {razorpay_order_id,razorpay_payment_id,razorpay_signature,amount,turfId,slotId} = req.body;
    const userId = req.user?.id;
    if(!userId) return res.status(401).json({error:"Unauthorized"});
    try {
        const bookingdetails = await db.selectFrom("slots").where("id","=",slotId).selectAll().executeTakeFirstOrThrow();
       const turf = await db.selectFrom("turfinfo").select("name").where("id","=",turfId).executeTakeFirstOrThrow();
       const userdetails = await db.selectFrom("users").select("email").where("id","=",userId).executeTakeFirstOrThrow();
       const soltTime = await db.selectFrom("slots").select("start_time").where("id","=",slotId).executeTakeFirstOrThrow();
      const booking = await paymentservices.verifypayment(
        // payment details
        {
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
          amount,
        },
        
        // booking details
        {
          id: slotId,
          turfId,
          userId,
          email:userdetails.email,
          slotTime:soltTime.start_time ,
          turfName:turf.name,
        }
      );

      return res.status(201).json({
        message: "Payment successful, booking confirmed",
        booking,
      });
    } catch (error) {
      console.error("Payment verification error:", error);
      return res.status(400).json({ 
        error: error instanceof Error ? error.message : "Payment verification failed" 
      });
    }
  };
