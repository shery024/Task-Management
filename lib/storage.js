// lib/storage.js - Data persistence using Upstash Redis with in-memory fallback

const memStore = {};

async function getRedis() {
  if (
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    try {
      const { Redis } = await import('@upstash/redis');
      return new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
    } catch (e) {
      console.error('[Redis init error]', e.message);
    }
  }
  return null;
}

export async function get(key) {
  const redis = await getRedis();
  if (redis) {
    try {
      // @upstash/redis auto-parses JSON, so value will be array or null
      const val = await redis.get(key);
      if (Array.isArray(val)) return val;
      if (val === null || val === undefined) return [];
      // If stored as string (fallback), try to parse
      if (typeof val === 'string') {
        try { return JSON.parse(val); } catch { return []; }
      }
      return [];
    } catch (e) {
      console.error('[Redis get error]', e.message);
    }
  }
  return memStore[key] || [];
}

export async function set(key, value) {
  const redis = await getRedis();
  if (redis) {
    try {
      // @upstash/redis accepts plain JS values and serialises them
      await redis.set(key, value);
    } catch (e) {
      console.error('[Redis set error]', e.message);
    }
  }
  memStore[key] = value;
  return value;
}

export async function isKVConfigured() {
  return !!(
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  );
}
