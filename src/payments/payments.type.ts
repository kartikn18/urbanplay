export type createorder = {
    slotId:number,
    turfid:number,
};
export type verifypatmentdetails ={
razorpay_order_id: string;
razorpay_payment_id: string;
razorpay_signature: string;
slotId: number;
turfId: number;
amount :number;
}
