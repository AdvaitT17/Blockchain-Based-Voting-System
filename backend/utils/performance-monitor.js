/**
 * Performance Monitoring Utility
 * Tracks API performance metrics and provides insights for optimization
 */

const logger = require('./logger');
const cacheManager = require('./cache-manager');
const os = require('os');

// Configuration
const METRICS_TTL = process.env.METRICS_TTL || 3600; // 1 hour
const METRICS_PREFIX = 'metrics:';

/**
 * Performance Monitor
 */
class PerformanceMonitor {
  /**
   * Initialize performance monitor
   */
  constructor() {
    this.startTime = Date.now();
    this.metrics = {
      requests: {
        total: 0,
        success: 0,
        error: 0,
        byEndpoint: {}
      },
      response: {
        totalTime: 0,
        avgTime: 0,
        byEndpoint: {}
      },
      cache: {
        hits: 0,
        misses: 0,
        ratio: 0
      },
      blockchain: {
        queries: 0,
        transactions: 0,
        totalTime: 0,
        avgTime: 0
      },
      system: {
        cpuUsage: 0,
        memoryUsage: 0,
        uptime: 0
      }
    };

    // Collect system metrics periodically
    this.systemMetricsInterval = setInterval(() => {
      this.collectSystemMetrics();
    }, 60000); // Every minute

    // Persist metrics periodically
    this.persistMetricsInterval = setInterval(() => {
      this.persistMetrics();
    }, 300000); // Every 5 minutes

    // Load previous metrics if available
    this.loadMetrics();
  }

  /**
   * Load metrics from cache
   */
  async loadMetrics() {
    try {
      const cachedMetrics = await cacheManager.get(`${METRICS_PREFIX}all`);
      if (cachedMetrics) {
        this.metrics = cachedMetrics;
        logger.info('Performance metrics loaded from cache');
      }
    } catch (error) {
      logger.error(`Error loading metrics: ${error.message}`);
    }
  }

  /**
   * Persist metrics to cache
   */
  async persistMetrics() {
    try {
      // Update system metrics before persisting
      this.collectSystemMetrics();
      
      // Persist metrics
      await cacheManager.set(`${METRICS_PREFIX}all`, this.metrics, METRICS_TTL);
      logger.debug('Performance metrics persisted to cache');
    } catch (error) {
      logger.error(`Error persisting metrics: ${error.message}`);
    }
  }

  /**
   * Collect system metrics
   */
  collectSystemMetrics() {
    try {
      // Calculate CPU usage
      const cpus = os.cpus();
      let totalIdle = 0;
      let totalTick = 0;
      
      for (const cpu of cpus) {
        for (const type in cpu.times) {
          totalTick += cpu.times[type];
        }
        totalIdle += cpu.times.idle;
      }
      
      const cpuUsage = 100 - (totalIdle / totalTick * 100);
      
      // Calculate memory usage
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const memoryUsage = ((totalMem - freeMem) / totalMem) * 100;
      
      // Update system metrics
      this.metrics.system = {
        cpuUsage: parseFloat(cpuUsage.toFixed(2)),
        memoryUsage: parseFloat(memoryUsage.toFixed(2)),
        uptime: Math.floor((Date.now() - this.startTime) / 1000) // in seconds
      };
    } catch (error) {
      logger.error(`Error collecting system metrics: ${error.message}`);
    }
  }

  /**
   * Track request
   * @param {Object} req Express request object
   * @param {Object} res Express response object
   * @param {Function} next Express next function
   * @returns {Function} Express middleware
   */
  trackRequest() {
    return (req, res, next) => {
      // Skip tracking for certain endpoints
      if (req.path === '/health' || req.path === '/metrics') {
        return next();
      }
      
      // Start time
      const start = Date.now();
      
      // Track request
      this.metrics.requests.total++;
      
      // Track by endpoint
      const endpoint = `${req.method} ${req.route ? req.route.path : req.path}`;
      if (!this.metrics.requests.byEndpoint[endpoint]) {
        this.metrics.requests.byEndpoint[endpoint] = {
          count: 0,
          success: 0,
          error: 0,
          totalTime: 0,
          avgTime: 0
        };
      }
      this.metrics.requests.byEndpoint[endpoint].count++;
      
      // Track response
      res.on('finish', () => {
        // Calculate response time
        const duration = Date.now() - start;
        
        // Update total response time
        this.metrics.response.totalTime += duration;
        this.metrics.response.avgTime = this.metrics.response.totalTime / this.metrics.requests.total;
        
        // Update endpoint response time
        this.metrics.requests.byEndpoint[endpoint].totalTime += duration;
        this.metrics.requests.byEndpoint[endpoint].avgTime = 
          this.metrics.requests.byEndpoint[endpoint].totalTime / this.metrics.requests.byEndpoint[endpoint].count;
        
        // Track success/error
        if (res.statusCode < 400) {
          this.metrics.requests.success++;
          this.metrics.requests.byEndpoint[endpoint].success++;
        } else {
          this.metrics.requests.error++;
          this.metrics.requests.byEndpoint[endpoint].error++;
        }
        
        // Track cache hit/miss
        if (res.locals.cacheHit) {
          this.metrics.cache.hits++;
        } else if (res.locals.cacheMiss) {
          this.metrics.cache.misses++;
        }
        
        // Update cache ratio
        const totalCacheRequests = this.metrics.cache.hits + this.metrics.cache.misses;
        if (totalCacheRequests > 0) {
          this.metrics.cache.ratio = (this.metrics.cache.hits / totalCacheRequests) * 100;
        }
      });
      
      // Add cache tracking to response
      res.locals.markCacheHit = () => {
        res.locals.cacheHit = true;
      };
      
      res.locals.markCacheMiss = () => {
        res.locals.cacheMiss = true;
      };
      
      next();
    };
  }

  /**
   * Track blockchain operation
   * @param {string} type Operation type (query or transaction)
   * @param {number} duration Operation duration in milliseconds
   */
  trackBlockchainOperation(type, duration) {
    if (type === 'query') {
      this.metrics.blockchain.queries++;
    } else if (type === 'transaction') {
      this.metrics.blockchain.transactions++;
    }
    
    this.metrics.blockchain.totalTime += duration;
    this.metrics.blockchain.avgTime = 
      this.metrics.blockchain.totalTime / (this.metrics.blockchain.queries + this.metrics.blockchain.transactions);
  }

  /**
   * Get all metrics
   * @returns {Object} All metrics
   */
  getMetrics() {
    // Update system metrics before returning
    this.collectSystemMetrics();
    
    return {
      ...this.metrics,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get metrics for a specific endpoint
   * @param {string} endpoint Endpoint path
   * @returns {Object} Endpoint metrics
   */
  getEndpointMetrics(endpoint) {
    return this.metrics.requests.byEndpoint[endpoint] || null;
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.startTime = Date.now();
    this.metrics = {
      requests: {
        total: 0,
        success: 0,
        error: 0,
        byEndpoint: {}
      },
      response: {
        totalTime: 0,
        avgTime: 0,
        byEndpoint: {}
      },
      cache: {
        hits: 0,
        misses: 0,
        ratio: 0
      },
      blockchain: {
        queries: 0,
        transactions: 0,
        totalTime: 0,
        avgTime: 0
      },
      system: {
        cpuUsage: 0,
        memoryUsage: 0,
        uptime: 0
      }
    };
    
    logger.info('Performance metrics reset');
  }

  /**
   * Clean up resources
   */
  cleanup() {
    clearInterval(this.systemMetricsInterval);
    clearInterval(this.persistMetricsInterval);
    
    // Persist metrics before cleanup
    this.persistMetrics();
  }

  /**
   * Express middleware for metrics endpoint
   * @returns {Function} Express middleware
   */
  metricsEndpoint() {
    return (req, res) => {
      res.json({
        success: true,
        message: 'Performance metrics retrieved successfully',
        data: this.getMetrics()
      });
    };
  }
}

// Export singleton instance
module.exports = new PerformanceMonitor();
