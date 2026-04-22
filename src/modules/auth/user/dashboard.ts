import {Request,Response,NextFunction} from 'express';
import { UserService } from './user.service';
export const userDashboardHandler = async(req:Request,res:Response,next:NextFunction)=>{
    const userid = req.user?.id;
    if(!userid){
        return res.status(401).json({message:"Unauthorized"}); 
    }
    try{
        const bookinghistory  = await UserService.paymenthistory(userid);
        res.status(200).json({
            message:"Booking history retrieved successfully",
            data:bookinghistory
        });
    }
    catch(error){
        console.error("Error retrieving booking history:", error);
        res.status(500).json({ message: "Internal server error" });
    };
}
