import Redis from 'ioredis';
import { Redis as UpstashRedis } from '@upstash/redis';
export const workerredis = new Redis({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    maxRetriesPerRequest:null
});
export const redis = new UpstashRedis({
    url: process.env.REDIS_URL!,
    token: process.env.REDIS_TOKEN!,
});
export const workerRedis = new Redis({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    maxRetriesPerRequest:null
});
redis.set('test', 'Redis connection successful');
redis.get('test').then((result) => {
    console.log(result); 
}).catch((err) => {
    console.error('Error connecting to Redis:', err);
});
workerRedis.on('error', (err) => {
    console.error('Worker Redis error:', err);
});
workerRedis.on('connect', () => {
    console.log('Connected to Worker Redis');
}); 