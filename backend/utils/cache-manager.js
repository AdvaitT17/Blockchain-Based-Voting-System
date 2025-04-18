/**
 * Cache Manager Utility
 * Provides caching functionality using Redis
 * Improves API performance by storing frequently accessed data
 */

const redis = require('redis');
const { promisify } = require('util');
const logger = require('./logger');

// Redis configuration
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = process.env.REDIS_PORT || 6379;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || '';
const REDIS_DB = process.env.REDIS_DB || 0;
const REDIS_PREFIX = process.env.REDIS_PREFIX || 'voting-system:';
const DEFAULT_TTL = process.env.REDIS_DEFAULT_TTL || 300; // 5 minutes

/**
 * Cache Manager
 */
class CacheManager {
  /**
   * Initialize Redis client
   */
  constructor() {
    this.client = redis.createClient({
      host: REDIS_HOST,
      port: REDIS_PORT,
      password: REDIS_PASSWORD || undefined,
      db: REDIS_DB,
      prefix: REDIS_PREFIX,
      retry_strategy: (options) => {
        if (options.error && options.error.code === 'ECONNREFUSED') {
          // End reconnecting on a specific error
          logger.error('Redis server refused connection');
          return new Error('The server refused the connection');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
          // End reconnecting after a specific timeout
          logger.error('Redis retry time exhausted');
          return new Error('Retry time exhausted');
        }
        if (options.attempt > 10) {
          // End reconnecting with built in error
          logger.error('Redis max retry attempts reached');
          return undefined;
        }
        // Reconnect after
        return Math.min(options.attempt * 100, 3000);
      }
    });

    // Promisify Redis methods
    this.getAsync = promisify(this.client.get).bind(this.client);
    this.setAsync = promisify(this.client.set).bind(this.client);
    this.delAsync = promisify(this.client.del).bind(this.client);
    this.expireAsync = promisify(this.client.expire).bind(this.client);
    this.keysAsync = promisify(this.client.keys).bind(this.client);
    this.flushdbAsync = promisify(this.client.flushdb).bind(this.client);
    this.hgetAsync = promisify(this.client.hget).bind(this.client);
    this.hsetAsync = promisify(this.client.hset).bind(this.client);
    this.hdelAsync = promisify(this.client.hdel).bind(this.client);
    this.hkeysAsync = promisify(this.client.hkeys).bind(this.client);
    this.incrAsync = promisify(this.client.incr).bind(this.client);
    this.decrAsync = promisify(this.client.decr).bind(this.client);

    // Handle Redis events
    this.client.on('error', (err) => {
      logger.error(`Redis error: ${err.message}`);
    });

    this.client.on('connect', () => {
      logger.info('Connected to Redis server');
    });

    this.client.on('ready', () => {
      logger.info('Redis client ready');
    });

    this.client.on('reconnecting', () => {
      logger.warn('Redis client reconnecting');
    });

    this.client.on('end', () => {
      logger.warn('Redis client connection closed');
    });

    // Register process exit handler
    process.on('SIGINT', () => {
      this.quit();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      this.quit();
      process.exit(0);
    });
  }

  /**
   * Close Redis connection
   */
  quit() {
    if (this.client) {
      logger.info('Closing Redis connection');
      this.client.quit();
    }
  }

  /**
   * Get cache key
   * @param {string} key Cache key
   * @returns {string} Formatted cache key
   */
  getKey(key) {
    return key;
  }

  /**
   * Get value from cache
   * @param {string} key Cache key
   * @returns {Promise<any>} Cached value or null if not found
   */
  async get(key) {
    try {
      const cacheKey = this.getKey(key);
      const data = await this.getAsync(cacheKey);

      if (!data) {
        return null;
      }

      try {
        return JSON.parse(data);
      } catch (e) {
        return data;
      }
    } catch (error) {
      logger.error(`Cache get error: ${error.message}`);
      return null;
    }
  }

  /**
   * Set value in cache
   * @param {string} key Cache key
   * @param {any} value Value to cache
   * @param {number} ttl Time to live in seconds
   * @returns {Promise<boolean>} True if successful
   */
  async set(key, value, ttl = DEFAULT_TTL) {
    try {
      const cacheKey = this.getKey(key);
      const data = typeof value === 'object' ? JSON.stringify(value) : value;

      if (ttl) {
        await this.setAsync(cacheKey, data, 'EX', ttl);
      } else {
        await this.setAsync(cacheKey, data);
      }

      return true;
    } catch (error) {
      logger.error(`Cache set error: ${error.message}`);
      return false;
    }
  }

  /**
   * Delete value from cache
   * @param {string} key Cache key
   * @returns {Promise<boolean>} True if successful
   */
  async del(key) {
    try {
      const cacheKey = this.getKey(key);
      await this.delAsync(cacheKey);
      return true;
    } catch (error) {
      logger.error(`Cache delete error: ${error.message}`);
      return false;
    }
  }

  /**
   * Delete multiple values from cache using pattern
   * @param {string} pattern Key pattern to match
   * @returns {Promise<boolean>} True if successful
   */
  async delByPattern(pattern) {
    try {
      const keys = await this.keysAsync(this.getKey(pattern));
      
      if (keys.length === 0) {
        return true;
      }

      await this.delAsync(keys);
      return true;
    } catch (error) {
      logger.error(`Cache delete by pattern error: ${error.message}`);
      return false;
    }
  }

  /**
   * Clear all cache
   * @returns {Promise<boolean>} True if successful
   */
  async clear() {
    try {
      await this.flushdbAsync();
      logger.info('Cache cleared');
      return true;
    } catch (error) {
      logger.error(`Cache clear error: ${error.message}`);
      return false;
    }
  }

  /**
   * Increment a counter in cache
   * @param {string} key Cache key
   * @param {number} ttl Time to live in seconds
   * @returns {Promise<number>} New counter value
   */
  async increment(key, ttl = DEFAULT_TTL) {
    try {
      const cacheKey = this.getKey(key);
      const value = await this.incrAsync(cacheKey);
      
      if (ttl) {
        await this.expireAsync(cacheKey, ttl);
      }
      
      return value;
    } catch (error) {
      logger.error(`Cache increment error: ${error.message}`);
      return 0;
    }
  }

  /**
   * Decrement a counter in cache
   * @param {string} key Cache key
   * @param {number} ttl Time to live in seconds
   * @returns {Promise<number>} New counter value
   */
  async decrement(key, ttl = DEFAULT_TTL) {
    try {
      const cacheKey = this.getKey(key);
      const value = await this.decrAsync(cacheKey);
      
      if (ttl) {
        await this.expireAsync(cacheKey, ttl);
      }
      
      return value;
    } catch (error) {
      logger.error(`Cache decrement error: ${error.message}`);
      return 0;
    }
  }

  /**
   * Get hash field value
   * @param {string} key Hash key
   * @param {string} field Hash field
   * @returns {Promise<any>} Field value or null if not found
   */
  async hget(key, field) {
    try {
      const cacheKey = this.getKey(key);
      const data = await this.hgetAsync(cacheKey, field);

      if (!data) {
        return null;
      }

      try {
        return JSON.parse(data);
      } catch (e) {
        return data;
      }
    } catch (error) {
      logger.error(`Cache hget error: ${error.message}`);
      return null;
    }
  }

  /**
   * Set hash field value
   * @param {string} key Hash key
   * @param {string} field Hash field
   * @param {any} value Field value
   * @param {number} ttl Time to live in seconds
   * @returns {Promise<boolean>} True if successful
   */
  async hset(key, field, value, ttl = DEFAULT_TTL) {
    try {
      const cacheKey = this.getKey(key);
      const data = typeof value === 'object' ? JSON.stringify(value) : value;

      await this.hsetAsync(cacheKey, field, data);
      
      if (ttl) {
        await this.expireAsync(cacheKey, ttl);
      }
      
      return true;
    } catch (error) {
      logger.error(`Cache hset error: ${error.message}`);
      return false;
    }
  }

  /**
   * Delete hash field
   * @param {string} key Hash key
   * @param {string} field Hash field
   * @returns {Promise<boolean>} True if successful
   */
  async hdel(key, field) {
    try {
      const cacheKey = this.getKey(key);
      await this.hdelAsync(cacheKey, field);
      return true;
    } catch (error) {
      logger.error(`Cache hdel error: ${error.message}`);
      return false;
    }
  }

  /**
   * Express middleware for caching
   * @param {string} key Cache key
   * @param {number} ttl Time to live in seconds
   * @returns {function} Express middleware
   */
  middleware(key, ttl = DEFAULT_TTL) {
    return async (req, res, next) => {
      try {
        // Generate dynamic key if function
        const cacheKey = typeof key === 'function' ? key(req) : key;
        
        // Skip cache if disabled
        if (req.query.noCache === 'true' || req.headers['x-no-cache'] === 'true') {
          logger.debug(`Cache disabled for request: ${cacheKey}`);
          return next();
        }
        
        // Try to get from cache
        const cachedData = await this.get(cacheKey);
        
        if (cachedData) {
          logger.debug(`Cache hit: ${cacheKey}`);
          return res.json({
            success: true,
            message: 'Data retrieved from cache',
            data: cachedData,
            cached: true
          });
        }
        
        // Cache miss, continue to handler
        logger.debug(`Cache miss: ${cacheKey}`);
        
        // Store original json method
        const originalJson = res.json;
        
        // Override json method
        res.json = function(data) {
          // Restore original json method
          res.json = originalJson;
          
          // Cache successful responses with data
          if (data && data.success && data.data) {
            // Cache response data
            this.set(cacheKey, data.data, ttl)
              .catch(err => logger.error(`Error caching response: ${err.message}`));
          }
          
          // Call original json method
          return originalJson.call(this, data);
        }.bind(this);
        
        next();
      } catch (error) {
        logger.error(`Cache middleware error: ${error.message}`);
        next();
      }
    };
  }
}

// Export singleton instance
module.exports = new CacheManager();
