import { Queue } from "bullmq";
import {workerredis} from '../config/redis';

export const otpqueue = new Queue("otpQueue",{
    connection:workerredis,
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
    connection:workerredis,
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
export const failedPaymentQueue = new Queue("failedPaymentQueue",{
    connection:workerredis,
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
export const adminNotificationQueue = new Queue("adminNotificationQueue",{
    connection:workerredis,
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