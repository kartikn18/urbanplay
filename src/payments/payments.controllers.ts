import {Request, Response,NextFunction} from "express";
import { paymentservices } from "./payments.service";
import{db} from "../config/db";

export const createorder = async(req:Request,res:Response,next:NextFunction)=>{
    const id = req.user?.id;// from JWT middleware
    if(!id) return res.status(401).json({error:"Unauthorized"});
    const turfid = parseInt(req.params.turfId as string) ;
    const slotId = parseInt(req.params.slotId as string) ;
    if(isNaN(turfid) || isNaN(slotId)){
        return res.status(400).json({error:"Invalid turfId or slotId"});
    }
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

    const slotIdNum = Number(slotId);
    if (!Number.isInteger(slotIdNum) || slotIdNum < 1) {
        return res.status(400).json({ error: "Invalid slotId" });
    }

    try {
        const slot = await db
            .selectFrom("slots")
            .where("id", "=", slotIdNum)
            .selectAll()
            .executeTakeFirstOrThrow();

        if (turfId !== undefined && turfId !== null && turfId !== "") {
            const tid = Number(turfId);
            if (!Number.isInteger(tid) || tid < 1) {
                return res.status(400).json({ error: "Invalid turfId" });
            }
            if (tid !== slot.turf_id) {
                return res.status(400).json({ error: "turfId does not match this slot" });
            }
        }

        const turf = await db
            .selectFrom("turfinfo")
            .select("name")
            .where("id", "=", slot.turf_id)
            .executeTakeFirstOrThrow();
        const userdetails = await db
            .selectFrom("users")
            .select("email")
            .where("id", "=", userId)
            .executeTakeFirstOrThrow();

        const booking = await paymentservices.verifypayment(
            {
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature,
                amount: Number(amount),
            },
            {
                id: slotIdNum,
                turfId: slot.turf_id,
                userId,
                email: userdetails.email,
                slotTime: slot.start_time,
                turfName: turf.name,
            },
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
