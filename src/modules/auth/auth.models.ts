import { db } from "../../config/db";
import type  {UserSignup} from "../auth/auth.types";

export const findUserByEmail = async (email: string) => {
  return await db
    .selectFrom("users")
    .selectAll()
    .where("email", "=", email)
    .executeTakeFirst();
};

export const createUser = async (data: UserSignup)  => {
  return await db
    .insertInto("users")
    .values({
      email: data.email,
      password: data.password,
      role: "user" 
    }as any)
    .returningAll()
    .executeTakeFirst();
};
export const saveRefreshToken = async(userid:number,hasedToken:string)=>{
    await db.insertInto("refreshtoken").values({user_id:userid,token:hasedToken}as any).execute()
};
export const updatepassowrd = async (data:UserSignup)=>{
    await db.updateTable('users').set({password:data.password}).where("email","=",data.email).execute()
};
export const saveotp = async (email:string,hashedotp:string,expires_at:Date)=>{
    await db.insertInto("otps").values({email,otp:hashedotp,expires_at}as any).execute()
};
export const findotp = async (email:string)=>{
    return await db.selectFrom("otps").selectAll().where("email","=",email).executeTakeFirst();
};
export const deleteotp = async (email:string)=>{
    await db.deleteFrom("otps").where("email","=",email).execute()
};
export const findrefreshtoken = async(userid:number)=>{
    return await db
    .selectFrom('refreshtoken').select('token').where('user_id','=',userid).executeTakeFirst();
};
export const deleteRefreshToken = async(userid:number)=>{
await db.deleteFrom('refreshtoken').where('user_id','=',userid).execute()};