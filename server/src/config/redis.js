import {createClient} from 'redis'
import dotenv from 'dotenv';
dotenv.config();
export const redis = createClient({
    url: process.env.REDIS_URL || "redis://127.0.0.1:6379",
    socket: {
        reconnectStrategy(retries) {
            if (retries > 5) return new Error("Redis connection failed after 5 retries.");
            return Math.min(retries * 250, 1500);
        },
    },
});

let lastRedisErrorLogAt = 0;
redis.on("error", (error) => {
    if (Date.now() - lastRedisErrorLogAt < 10000) return;
    lastRedisErrorLogAt = Date.now();
    console.error("Redis client error:", error.message);
});

const connectRedis = async() => {
try {
    await redis.connect()
    console.log("redis connect successfully!")
} catch (err) {
  console.error("Could not connect to Redis:", err.message);
  throw err;
}
}
export default connectRedis;