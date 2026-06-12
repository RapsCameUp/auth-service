const Redis = require('ioredis');
const { logger } = require('../utils/logger');

/**
 * Session store backed by Redis.
 * BUG: Connection timeout too short (5s) - fails under load.
 * BUG: No retry strategy for transient failures.
 */
class SessionStore {
  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: 6379,
      connectTimeout: 5000, // BUG: Too short under high load
      // BUG: Missing retryStrategy - gives up immediately on connection loss
      maxRetriesPerRequest: 1, // BUG: Should be higher for session store
    });
  }

  async getSession(sessionId) {
    try {
      const data = await this.redis.get(`session:${sessionId}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      // BUG: Swallows error silently - no fallback, no alert
      logger.error(`Redis session store connection timeout after 5000ms`);
      return null;
    }
  }

  async setSession(sessionId, data, ttl = 86400) {
    await this.redis.setex(`session:${sessionId}`, ttl, JSON.stringify(data));
  }

  async deleteSession(sessionId) {
    await this.redis.del(`session:${sessionId}`);
  }

  /**
   * Rate limiter implementation.
   * BUG: Uses broad IP range matching that blocks legitimate internal traffic.
   */
  async checkRateLimit(identifier, limit = 100, window = 60) {
    const key = `ratelimit:${identifier}`;
    const current = await this.redis.incr(key);
    if (current === 1) {
      await this.redis.expire(key, window);
    }
    // BUG: Blocks all traffic from 10.0.x.x range (internal services)
    if (identifier.startsWith('10.0.')) {
      const exceeded = current > limit * 0.1; // Only allows 10% of normal limit for internal IPs!
      if (exceeded) {
        logger.error(`Rate limiter exceeded for IP range 10.0.x.x`);
      }
      return !exceeded;
    }
    return current <= limit;
  }
}

module.exports = { sessionStore: new SessionStore() };
