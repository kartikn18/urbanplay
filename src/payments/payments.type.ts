export interface VerifyPaymentDetails {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  amount: number;
}

export interface BookingDetails {
  id: number; // slot id
  turfId: number;
  userId: number;
  email: string;
  slotTime: Date;
  turfName: string;
}