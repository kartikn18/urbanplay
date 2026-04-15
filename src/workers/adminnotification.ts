import { Worker } from "bullmq";
import { redis } from "../config/redis";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY) ;

export const adminnotificationworker = new Worker(
    "adminNotificationQueue",
    async(job)=>{
        await resend.emails.send({
            from:"turf@booking.com",
            to:job.data.email,
            subject:"New Booking Alert",
            html:`
                <h2>New Booking Received!</h2>
                        <p>Turf: ${job.data.turfName}</p>
                        <p>Time: ${job.data.slotTime}</p>
                        <p>Amount: ₹${job.data.amount / 100}</p>
                        <p>Booking ID: ${job.data.bookingId}</p>
            `,
        })
    },
    {connection:redis}
);
adminnotificationworker.on("completed",(job)=>{
    console.log(`Admin notification sent for booking ${job.data.bookingId}`);
})
adminnotificationworker.on("failed",(job,err)=>{
    console.error(`Failed to send admin notification for booking ${job?.data?.bookingId ?? "unknown"}:`, err);
});