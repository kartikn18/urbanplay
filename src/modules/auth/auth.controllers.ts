import {Request,Response,NextFunction} from 'express'
import {usersignup,LoginUser,forgotpassword, generateAndSaveOTP,sendotpemail,verifyotp,rotatetoken} from './auth.service'
import { updatepassowrd } from './auth.models';
import jwt from 'jsonwebtoken';

export const signup = async (req:Request,res:Response,next:NextFunction)=>{
    try {
        const newuser = await usersignup(req.body);
        if (!newuser) {
            return res.status(400).json({message:"Failed to create user"});
        }
        res.status(201).json({
            message:"User created successfully",
            data:{id:newuser.id,email:newuser.email}
        })
    } catch (error) {
        next(error);
        };
    };

export const login = async (req:Request,res:Response,next:NextFunction)=>{
    try {
        const {accesstoken,refreshtoken} = await LoginUser(req.body);
        res.cookie("refreshToken",refreshtoken,{
            httpOnly:true,
            secure:true,
            sameSite:"strict",
            maxAge:7*24*60*60*1000//1 week
        })
        res.status(200).json({
            message:"Login successful",
            data:{accesstoken}
        })
    } catch (error) {
        next(error);
    }
};
export const forgotpasswords = async(req:Request,res:Response,next:NextFunction)=>{
    try {
        const email = req.body;
        await forgotpassword(email);
        const otp = await generateAndSaveOTP(email);
        await sendotpemail(email,otp);
        res.status(200).json({
            message:"Password reset instructions sent to your email"
        })
    } catch (error) {
        next(error);
    }
};
export const verifyotps = async(req:Request,res:Response,next:NextFunction)=>{
    try {
        const {email,otp} = req.body;
        await verifyotp(email,otp);
        res.status(200).json({
            success:true,
            message:"OTP verified successfully"
        })  
    } catch (error) {
        next(error);
    }
};
export const resetpassword = async(req:Request,res:Response,next:NextFunction)=>{
    try {
        const {email,password} = req.body;
        await updatepassowrd({email,password});
        res.status(200).json({
            success:true,
            message:"Password reset successfully"
        })  
    } catch (error) {
        next(error);
    }
};
export const rotatoken = async(req:Request,res:Response,next:NextFunction)=>{
    const incomingrefreshToken = req.cookies.refreshToken ;
    if(!incomingrefreshToken){
        return res.status(401).json({message:"Refresh token not found"});
    }
    try {
        const decoded = jwt.verify(incomingrefreshToken,process.env.REFRESH_TOKEN_SECRET as any) as {userId:number,role:string};
        const {accesstoken, newrefreshtoken} = await rotatetoken(decoded.userId,incomingrefreshToken,decoded.role);
        res.cookie("refreshToken", newrefreshtoken, {
            httpOnly:true,
            secure:true,
            sameSite:"strict",
            maxAge:7*24*60*60*1000//1 week
        })
        res.status(200).json({
            message:"Token rotated successfully",
            data:{accesstoken,newrefreshtoken}
        })
    } catch (error) {
        next(error);
    }
}