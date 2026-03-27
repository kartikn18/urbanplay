import { paymentmodel } from "./payments.model";
import { userModel } from "../modules/auth/user/user.models";
import { razopayconfig } from "../config/razorpay";
import { verifypatmentdetails } from "./payments.type";
import CryptoJS from "crypto"
export const paymentservices = {
    async createorder(turfId:number,slotId:number,userid:number,paymentdetails:verifypatmentdetails){
        const turf = await userModel.findturfbyId(turfId);
        if(!turf){
            throw new Error("turf not found")
        }
        const slot = await userModel.findslotsbySlotId(slotId);
        if(!slot){
            throw new Error("slot not found")
        }
        const createorder  = await razopayconfig.orders.create({
            amount:turf.price_per_hour*100,
            currency:"INR",
            receipt:`receipt_${Math.random()*1000}`,
        })
        return {
            orderId:createorder.id, 
            amount :paymentdetails.amount,
            currency:createorder.currency
            keyid:process.env.RAZORPAY_KEY_ID
        };
    },
    async verifypayment(paymentdetails:verifypatmentdetails){
        const 
    }
    }
