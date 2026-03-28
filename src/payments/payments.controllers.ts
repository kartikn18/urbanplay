import {Request, Response,NextFunction} from "express";
import { paymentservices } from "./payments.service";

export const createorder = async(req:Request,res:Response,next:NextFunction)=>{
    const id = req.user?.id;
    const {turfid,slotId} = req.body;
    try {
        const order = await paymentservices.createorder(turfid,slotId,id!);
        res.status(200).json({
            message:"Order created successfully",
            data:order
        })
    } catch (error) {
        next(error);
    };
const verifypayments = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id as number;                    // from JWT middleware

      const { 
        razorpay_order_id, 
        razorpay_payment_id, 
        razorpay_signature,
        amount,
        slotId,
        turfId,
      } = req.body;

      // Validate input
      if (
        !razorpay_order_id ||
        !razorpay_payment_id ||
        !razorpay_signature ||
        !slotId ||
        !turfId ||
        !amount
      ) {
        return res.status(400).json({ 
          error: "All payment details are required" 
        });
      }

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

}
