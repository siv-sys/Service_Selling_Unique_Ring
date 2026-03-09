const redis = require('redis');
require('dotenv').config();

// Create Redis client (optional - you can comment this out if not using Redis)
const redisClient = redis.createClient({
  url: `redis://${process.env.REDIS_HOST || '127.0.0.1'}:${process.env.REDIS_PORT || 6379}`,
  password: process.env.REDIS_PASSWORD || undefined
});

redisClient.on('error', (err) => {
  // Don't crash the app if Redis is not available
  console.warn('⚠️ Redis Client Error:', err.message);
});

redisClient.on('connect', () => console.log('✅ Redis connected successfully'));

const connectRedis = async () => {
  try {
    await redisClient.connect();
    return true;
  } catch (error) {
    console.warn('⚠️ Redis connection failed - caching disabled');
    return false;
  }
};

module.exports = { redisClient, connectRedis };