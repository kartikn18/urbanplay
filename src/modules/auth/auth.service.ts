import { findUserByEmail,createUser,saveRefreshToken,saveotp,deleteotp,findotp, updatepassowrd,
    findrefreshtoken,deleteRefreshToken
} from "./auth.models";
import type { UserSignup ,UserLogin} from "./auth.types";
import { generateAccessToken, generateRefreshToken } from "../../utils/jwt";
import bcrypt from "bcrypt";
import {Resend} from 'resend';
export const usersignup = async (data:UserSignup) =>{
    const existngUser = await findUserByEmail(data.email);
    if(existngUser){
        throw new Error("User already exists");
    }
    const hashedpassword = await bcrypt.hash(data.password,10)
    const newUser = await createUser({...data,password:hashedpassword})
    return newUser;
};
export const LoginUser = async (data:UserLogin)=>{
    const user = await findUserByEmail(data.email);
    if(!user){
        throw new Error("User not found");
    }
    const isPasswordValid = await bcrypt.compare(data.password,user.password);
    if(!isPasswordValid){
        throw new Error("Invalid password");
    }
    const refreshtoken = generateRefreshToken(user.id,user.role);
    const hashedtoken = await bcrypt.hash(refreshtoken,10);
    await saveRefreshToken(user.id,hashedtoken);
    const accesstoken = generateAccessToken(user.id,user.role);
    return {accesstoken,refreshtoken};
};
const createotp = () => Math.floor(100000 + Math.random() * 900000).toString();

export const  forgotpassword = async (email:string) =>{
    const user = await findUserByEmail(email);
    if(!user){
        throw new Error("User not found");
    }
};
export const generateAndSaveOTP = async (email:string)=>{
    const otp = createotp();
    const hashedotp = await bcrypt.hash(otp,10);
    const expires_at = new Date(Date.now() + 10 * 60 * 1000);//10 minutes
    await saveotp(email,hashedotp,expires_at);
    return otp;
};
export const verifyotp = async(email:string,otp:string)=>{
    const record = await findotp(email);
    if(!record){
        throw new Error("OTP not found");
    }
    if(record.expires_at < new Date()){
        await deleteotp(email);
        throw new Error("OTP expired");
    }
    const isValid = await bcrypt.compare(otp,record.otp);
    if(!isValid){
        throw new Error("Invalid OTP");
    }
    await deleteotp(email);
}
const resend = new Resend(process.env.RESEND_API_KEY || '');
export const sendotpemail = async (email:string,otp:string)=>{
    await resend.emails.send({
        from:'turf <turf@example.com>',// sender address
        to:`${email},`, // list of receivers
        subject:"OTP for turf", // Subject line
        text:"This is a test email from turf.", // plain text body
        html:`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/></head> <body style="font-family:sans-serif;background:#eee;padding:15px;"> <div style="border:1px solid #ccc;background:#fff;padding:15px;"> <h3 style="margin-top:0;color:#666;">OTP for turf</h3> <p><strong>This is a test email from turf.</strong></p> </div> </body> </html>` // html body
    });
};
export const resetpassword = async (email:string ,newpasswword:string)=>{
    const user = await findUserByEmail(email);
    if(!user){
        throw new Error("User not found");
    }
    const hashedpassword = await bcrypt.hash(newpasswword,10);
    await updatepassowrd({email,password:hashedpassword});
};
// rotate refresh token
export const rotatetoken = async (userid:number,incomingtoken:string,role:string)=>{
    const storedtoken = await findrefreshtoken(userid) as any;
    if(!storedtoken){
        throw new Error("Refresh token not found") 
    }
    const isvalid = await bcrypt.compare(incomingtoken,storedtoken.token);
    if(!isvalid){
        throw new Error("Invalid refresh token");
    }
     await deleteRefreshToken(userid);
    const newrefreshtoken = await generateRefreshToken(userid,role);
    const hashedtoken = await bcrypt.hash(newrefreshtoken,10);
    await saveRefreshToken(userid,hashedtoken);
    const accesstoken = generateAccessToken(userid,role);
    return {accesstoken,newrefreshtoken};
};