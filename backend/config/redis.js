const redis = require('redis');
const dotenv = require('dotenv');

dotenv.config();

let redisClient = null;

// Only connect if Redis is enabled
if (process.env.REDIS_ENABLED === 'true') {
  redisClient = redis.createClient({
    url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
    password: process.env.REDIS_PASSWORD || undefined
  });

  redisClient.on('connect', () => {
    console.log('✅ Redis client connected');
  });

  redisClient.on('error', (err) => {
    console.error('❌ Redis client error:', err.message);
  });
}

// Connect to Redis
const connectRedis = async () => {
  if (!redisClient || process.env.REDIS_ENABLED !== 'true') {
    console.log('⚠️ Redis is disabled');
    return false;
  }
  
  try {
    await redisClient.connect();
    return true;
  } catch (error) {
    console.error('❌ Redis connection failed:', error.message);
    return false;
  }
};

// Cache helper functions
const cacheMiddleware = {
  // Get cached data
  get: async (key) => {
    if (!redisClient || process.env.REDIS_ENABLED !== 'true') return null;
    
    try {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  },

  // Set cache with TTL
  set: async (key, data, ttl = parseInt(process.env.CACHE_TTL) || 3600) => {
    if (!redisClient || process.env.REDIS_ENABLED !== 'true') return false;
    
    try {
      await redisClient.setEx(key, ttl, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Redis set error:', error);
      return false;
    }
  },

  // Delete cache
  del: async (pattern) => {
    if (!redisClient || process.env.REDIS_ENABLED !== 'true') return false;
    
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
      return true;
    } catch (error) {
      console.error('Redis delete error:', error);
      return false;
    }
  },

  // Clear all ring-related cache
  clearRingCache: async () => {
    return await cacheMiddleware.del('rings:*');
  }
};

module.exports = {
  redisClient,
  connectRedis,
  cacheMiddleware
};