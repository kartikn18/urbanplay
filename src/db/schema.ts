export type  User = {
    id:number,
    password:string,
    email:string,
    role:string,
    created_at:Date,
    updated_at:Date
    refresh_token:string 
}
export type otp = {
    id:number,
    email:string,
    otp:string,
    expires_at:Date,
    created_at:Date
}
export interface  Database {
    users:User,
    otps:otp,
}