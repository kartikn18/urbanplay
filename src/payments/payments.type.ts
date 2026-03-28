export interface verifypatmentdetails {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  amount: number;
}

export interface bookingdetails {
  id: number;      // slot id
  turfId: number;
  userId: number;
}