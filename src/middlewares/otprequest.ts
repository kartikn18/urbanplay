import {Request,Response,NextFunction} from "express";
import {redis} from '../config/redis'

export const otprequest = async(req:Request,res:Response,next:NextFunction)=>{
    const {email} = req.body;
    if(!email){
        return res.status(400).json({
            message:"Email is required"
        })
    }
    const key = `otp_request:${email}`;
    const maxwindowsize = 5*60; //5 minutes
    const otprequest = 3;
    try {
        const count = await redis.incr(key);
        if(count ===1){
            await redis.expire(key,maxwindowsize);
        }
        const ttl = await redis.ttl(key);
        const remainingrequest = otprequest - count;
        if(remainingrequest <=0){
            return res.status(429).json({
                message:"Too many OTP requests. Please try again later.",
                retry_after:ttl
            })
        }
        next();
    } catch (error) {
        next(error);
    }
};
export const otpAttemptLimit = async(req:Request,res:Response,next:NextFunction)=>{
    const {email} = req.body;
    if(!email){
        res.status(400).json({message:"Email is required"});
        return;
    }
    const key = `otp_attempt:${email}`;
    const windowSeconds = 5*60;//5 minutes
    const maxAttempts = 3;
    try {
        const count = await redis.incr(key);
        if(count ===1){
            await redis.expire(key,windowSeconds);
        }
        const ttl = await redis.ttl(key);
        const remainingAttempts = Math.max(0,maxAttempts - count);
        res.setHeader('X-RateLimit-Limit', maxAttempts);
        res.setHeader('X-RateLimit-Remaining', remainingAttempts);
        res.setHeader('X-RateLimit-Reset', ttl);
        if(count > maxAttempts){
            res.status(429).json({
                success:false,
                message:"Too many OTP attempts. Please try again later.",
                retry_after:ttl
            });
            return;
        }
        next(); 
    } catch (error) {
        res.status(500).json({ message: "Service unavailable" });
    }
};