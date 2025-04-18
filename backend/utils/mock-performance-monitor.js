/**
 * Mock Performance Monitoring Utility
 * Provides simplified performance monitoring for testing
 */

const logger = require('./logger');

/**
 * Mock Performance Monitor
 */
class MockPerformanceMonitor {
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
        avgTime: 0
      },
      cache: {
        hits: 0,
        misses: 0,
        ratio: 0
      },
      system: {
        uptime: 0
      }
    };
    
    logger.info('Mock Performance Monitor initialized');
  }

  /**
   * Track request
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
   * Get all metrics
   * @returns {Object} All metrics
   */
  getMetrics() {
    // Update uptime
    this.metrics.system.uptime = Math.floor((Date.now() - this.startTime) / 1000); // in seconds
    
    return {
      ...this.metrics,
      timestamp: new Date().toISOString()
    };
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
        avgTime: 0
      },
      cache: {
        hits: 0,
        misses: 0,
        ratio: 0
      },
      system: {
        uptime: 0
      }
    };
    
    logger.info('Performance metrics reset');
  }

  /**
   * Clean up resources
   */
  cleanup() {
    logger.info('Mock Performance Monitor cleaned up');
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
module.exports = new MockPerformanceMonitor();
