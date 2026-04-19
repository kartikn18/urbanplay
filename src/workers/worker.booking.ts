import { Worker } from "bullmq";
import { workerRedis } from "../config/redis";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

 export const paymentworker = new Worker(
    "bookingEmailQueue",
    async(job)=>{
        await resend.emails.send({
            from:"turf <onboarding@resend.dev>",
            to:job.data.email,
            subject:"Booking Confirmation",
            html:`
                <h2>Booking Confirmed!</h2>
                        <p>Turf: ${job.data.turfName}</p>
                        <p>Time: ${job.data.slotTime}</p>
                        <p>Amount: ₹${job.data.amount / 100}</p>
                        <p>Booking ID: ${job.data.bookingId}</p>
            `
        })
        
    },
    {connection:workerRedis}
);
paymentworker.on("completed",(job)=>{
    console.log(`Email sent for booking ${job.data.bookingId}`);
})
paymentworker.on("failed",(job,err)=>{
    console.error(`Failed to send email for booking ${job?.data?.bookingId ?? "unknown"}:`, err);
});

export const failedpaymentworker = new Worker(
    "failedPaymentQueue",
    async(job)=>{
        await resend.emails.send({
            from:"turf <onboarding@resend.dev>",
            to:job.data.email,
            subject:"Payment Failed",
            html: ` <h2>Payment Failed</h2>
                        <p>Turf: ${job.data.turfName}</p>
                        <p>Time: ${job.data.slotTime}</p>
                        <p>Reason: ${job.data.reason}</p>
                        <p>Please try again.</p>
                    `
        })
    },
    {connection:workerRedis}
);
failedpaymentworker.on("completed",(job)=>{
    console.log(`Failed payment email sent for booking ${job.data.bookingId}`);
})
failedpaymentworker.on("failed",(job,err)=>{
    console.error(`Failed to send failed payment email for booking ${job?.data?.bookingId ?? "unknown"}:`, err);
});