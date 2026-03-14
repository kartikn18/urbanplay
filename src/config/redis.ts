import createClient from 'ioredis'

export const redis = new createClient({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    password: process.env.REDIS_PASSWORD 
});
redis.on('error', (err) => {
    console.error('Redis error:', err);
});
redis.on('connect', () => {
    console.log('Connected to Redis');
}); 
