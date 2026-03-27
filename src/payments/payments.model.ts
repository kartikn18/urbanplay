import { db } from "../config/db";

export const paymentmodel = {
    async createpayment(bookingId: number, amount: number, paymentMethod: string, paymentStatus: string) {
        return await db.insertInto("payments").values({
            booking_id: bookingId,
            amount,
            payment_method: paymentMethod,
            payment_status: paymentStatus
        } as any).execute();
    },
}