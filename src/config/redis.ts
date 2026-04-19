import Redis from 'ioredis';

export const redis = new Redis({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
});
export const workerRedis = new Redis({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    maxRetriesPerRequest:null
});
redis.on('error', (err) => {
    console.error('Redis error:', err);
});
redis.on('connect', () => {
    console.log('Connected to Redis');
}); 
workerRedis.on('error', (err) => {
    console.error('Worker Redis error:', err);
});
workerRedis.on('connect', () => {
    console.log('Connected to Worker Redis');
}); 