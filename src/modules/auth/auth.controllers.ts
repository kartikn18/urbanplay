import {Request,Response,NextFunction} from 'express'
import {usersignup,LoginUser,forgotpassword, generateAndSaveOTP,sendotpemail,verifyotp,rotatetoken,resetpassword} from './auth.service'
import jwt from 'jsonwebtoken';

const isProduction = process.env.NODE_ENV === "production";
const refreshCookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: (isProduction ? "none" : "lax") as "none" | "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
};

export const signup = async (req:Request,res:Response,next:NextFunction)=>{
    try {
        const newuser = await usersignup(req.body);
        if (!newuser) {
            return res.status(400).json({message:"Failed to create user"});
        }
        res.status(201).json({
            message:"User created successfully",
            data:{id:newuser.id,email:newuser.email,role:newuser.role}
        })
    } catch (error) {
        next(error);
        };
    };

export const login = async (req:Request,res:Response,next:NextFunction)=>{
    try {
        const {accesstoken,refreshtoken,role} = await LoginUser(req.body);
        res.cookie("refreshToken", refreshtoken, refreshCookieOptions)
        res.status(200).json({
            message:"Login successful",
            data:{accesstoken,role}
        })
    } catch (error) {
        next(error);
    }
};
export const forgotpasswords = async(req:Request,res:Response,next:NextFunction)=>{
    try {
        const {email} = req.body;
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
export const resetpasswords = async(req:Request,res:Response,next:NextFunction)=>{
    try {
        const {email,password} = req.body;
        await resetpassword(email,password);
        res.status(200).json({
            success:true,
            message:"Password reset successfully"
        })  
    } catch (error) {
        next(error);
    }
};
export const rotatoken = async(req:Request,res:Response,next:NextFunction)=>{
    const incomingrefreshToken = req.cookies?.refreshToken;
    if(!incomingrefreshToken){
        return res.status(401).json({message:"Refresh token not found"});
    }
    try {
        const decoded = jwt.verify(incomingrefreshToken,process.env.REFRESH_TOKEN_SECRET as string) as {userid:number,role:string};
        const {accesstoken, newrefreshtoken} = await rotatetoken(decoded.userid,incomingrefreshToken,decoded.role);
        res.cookie("refreshToken", newrefreshtoken, refreshCookieOptions)
        res.status(200).json({
            message:"Token rotated successfully",
            data:{accesstoken,role:decoded.role}
        })
    } catch (error) {
        next(error);
    }
}