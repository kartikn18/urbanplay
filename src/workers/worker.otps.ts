import { Worker } from "bullmq";
import { redis } from "../config/redis";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY) || "";

export const otpWorker = new Worker(
    "otpQueue",
    async (job) => {
        await resend.emails.send({
            from: "turf <turf@example.com>",
            to: job.data.email,
            subject: "Your OTP",
            html: `
                <h2>Your OTP is: ${job.data.otp}</h2>
                <p>Valid for 10 minutes</p>
            `,
        });
    },
    { connection: redis }
);