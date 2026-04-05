import { Queue } from "bullmq";
import {redis} from '../config/redis';

export const otpqueue = new Queue("otpQueue",{
    connection:redis,
    defaultJobOptions:{
        attempts:3,
        backoff:{
            type:"exponential",
            delay:1000
        },
        removeOnComplete:true,
        removeOnFail:false
    }
});
export const bookingemailqueue = new Queue("bookingEmailQueue",{
    connection:redis,
    defaultJobOptions:{
        attempts:1,
        backoff:{
            type:"exponential",
            delay:1000
        },
        removeOnComplete:true,
        removeOnFail:false
    }
});
export const failedpaymetqueue = new Queue("failedPaymentQueue",{
    connection:redis,
    defaultJobOptions:{
        attempts:3,
        backoff:{
            type:"exponential",
            delay:1000
        },
        removeOnComplete:true,
        removeOnFail:false
    }
});