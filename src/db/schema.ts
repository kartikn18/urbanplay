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
    creates_at:Date,
    role:string
}
export type TurfInfo = {
    id:number,
    name:string,
    location:string,
    description:string,
    price_per_hour:number,
    image_url:string,
    lat:number,
    lng:number,
    created_at:Date,
    created_by:number,
    updated_at:Date
}
export type Slot = {
    id:number,
    turf_id:number,
    start_time:Date,
    end_time:Date,
    is_booked:boolean,
    created_at:Date,
    updated_at:Date
}
export type Booking = {
    id:number,
    slot_id:number,
    user_id:number,
    created_at:Date,
    updated_at:Date
    status:string
}
export interface  Database {
    users:User,
    otps:otp,
    refreshtoken:RefreshToken,
    turfinfo:TurfInfo,
    slots:Slot,
    bookings:Booking
}