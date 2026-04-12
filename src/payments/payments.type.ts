export interface VerifyPaymentDetails {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  amount: number;
}

/** Context for completing a booking after payment; turfId must match the slot’s turf in DB. */
export interface BookingDetails {
  id: number; // slot id
  turfId: number;
  userId: number;
  email: string;
  slotTime: Date;
  turfName: string;
}