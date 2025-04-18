/**
 * Mock Cache Manager Utility
 * Provides in-memory caching functionality for testing
 */

const logger = require('./logger');

// Default TTL in seconds
const DEFAULT_TTL = 300; // 5 minutes

/**
 * Mock Cache Manager
 */
class MockCacheManager {
  /**
   * Initialize in-memory cache
   */
  constructor() {
    this.cache = new Map();
    this.timeouts = new Map();
    logger.info('Mock Cache Manager initialized');
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
      const data = this.cache.get(cacheKey);

      if (!data) {
        return null;
      }

      return data;
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
      this.cache.set(cacheKey, value);

      // Clear existing timeout if any
      if (this.timeouts.has(cacheKey)) {
        clearTimeout(this.timeouts.get(cacheKey));
      }

      // Set expiration timeout
      if (ttl) {
        const timeout = setTimeout(() => {
          this.cache.delete(cacheKey);
          this.timeouts.delete(cacheKey);
        }, ttl * 1000);
        
        this.timeouts.set(cacheKey, timeout);
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
      this.cache.delete(cacheKey);
      
      // Clear timeout if any
      if (this.timeouts.has(cacheKey)) {
        clearTimeout(this.timeouts.get(cacheKey));
        this.timeouts.delete(cacheKey);
      }
      
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
      const regex = new RegExp(pattern.replace('*', '.*'));
      
      for (const key of this.cache.keys()) {
        if (regex.test(key)) {
          await this.del(key);
        }
      }
      
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
      this.cache.clear();
      
      // Clear all timeouts
      for (const timeout of this.timeouts.values()) {
        clearTimeout(timeout);
      }
      this.timeouts.clear();
      
      logger.info('Cache cleared');
      return true;
    } catch (error) {
      logger.error(`Cache clear error: ${error.message}`);
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
          res.locals.markCacheHit && res.locals.markCacheHit();
          return res.json({
            success: true,
            message: 'Data retrieved from cache',
            data: cachedData,
            cached: true
          });
        }
        
        // Cache miss, continue to handler
        logger.debug(`Cache miss: ${cacheKey}`);
        res.locals.markCacheMiss && res.locals.markCacheMiss();
        
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
module.exports = new MockCacheManager();
