import { Redis } from "ioredis";

export const redis = new Redis(process.env.REDIS_URL!, {
    maxRetriesPerRequest: null, // required by BullMQ Workers
    retryStrategy(times) {
        if(times > 3) {
            console.error("Could not connect to Redis after 3 attempts. Is Docker running?");
            return null;
        } 
        return Math.min(times * 200 * 1000);
    },
});

redis.on("error", (err) => {
    // ioredis requires an error listener or it crashes the process on repeated errors
})