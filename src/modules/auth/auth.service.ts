import { findUserByEmail,createUser,saveRefreshToken,saveotp,deleteotp,findotp, updatepassowrd,
    findrefreshtoken,deleteRefreshToken
} from "./auth.models";
import type { UserSignup ,UserLogin} from "./auth.types";
import { generateAccessToken, generateRefreshToken } from "../../utils/jwt";
import bcrypt from "bcrypt";
import {Resend} from 'resend';
import { otpqueue } from "../../queues";
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
    await saveRefreshToken(user.id,hashedtoken,user.role);
    const accesstoken = generateAccessToken(user.id,user.role);
    return {accesstoken,refreshtoken,role:user.role};
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
const resend = new Resend(process.env.RESEND_API_KEY);
export const sendotpemail = async (email:string,otp:string)=>{
    await otpqueue.add("sendOTP",{email,otp});
    return otp;
};
export const resetpassword = async (email:string ,newpasswword:string)=>{
    const user = await findUserByEmail(email);
    if(!user){
        throw new Error("User not found");
    }
    const hashedpassword = await bcrypt.hash(newpasswword,10);
    await updatepassowrd({email,password:hashedpassword,role:user.role} as UserSignup);
};
// rotate token function to issue new access and refresh tokens
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
    await saveRefreshToken(userid,hashedtoken,role);
    const accesstoken = generateAccessToken(userid,role);
    return {accesstoken,newrefreshtoken};
};