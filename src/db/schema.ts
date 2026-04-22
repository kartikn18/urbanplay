export type User = {
    id: number;
    email: string;
    password: string;
    role: string;
    created_at: Date;
}

export type Otp = {
    id: number;
    email: string;
    otp: string;
    expires_at: Date;
    created_at: Date;
}

export type RefreshToken = {
    id: number;
    user_id: number;
    token: string;
    role: string;
    expires_at: Date;
    created_at: Date;
}

export type TurfInfo = {
    id: number;
    name: string;
    location: string;
    description: string;
    lat: number;
    lng: number;
    price_per_hour: number;
    image_url: string;
    created_by: number;
    created_at: Date;
}

export type Slot = {
    id: number;
    turf_id: number;
    start_time: Date;
    end_time: Date;
    is_booked: boolean;
    created_at: Date;
}

export type Booking = {
    booking_id: number;   // ← primary key is booking_id not id
    user_id: number;
    slot_id: number;
    turf_id: number;
    status: string;
    created_at: Date;
}

export type Payment = {
    id: number;
    booking_id: number;
    user_id: number;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    amount: number;
    payment_status: string;
    created_at: Date;
    recipts_url: string;
}

export interface Database {
    users: User;
    otps: Otp;
    refresh_tokens: RefreshToken;  // ← matches table name
    turfinfo: TurfInfo;
    slots: Slot;
    bookings: Booking;
    payments: Payment;
}