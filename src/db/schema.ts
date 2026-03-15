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
export type RefreshToken = {
    id:number,
    user_id :number,
    token:string,
    expires_at:Date,
    creates_at:Date
}
export type TurfInfo = {
    id:number,
    name:string,
    location:string,
    description:string,
    price_per_hour:number,
    created_at:Date,
    updated_at:Date
}
export interface  Database {
    users:User,
    otps:otp,
    refreshtoken:RefreshToken
    turfinfo:TurfInfo
}