/**
 * Logger Utility
 * Provides standardized logging functionality across the application
 * Supports different log levels and formats for development and production
 */

const winston = require('winston');
const { format } = winston;
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Environment configuration
const NODE_ENV = process.env.NODE_ENV || 'development';
const LOG_LEVEL = process.env.LOG_LEVEL || (NODE_ENV === 'production' ? 'info' : 'debug');
const LOG_FILE = process.env.LOG_FILE || path.join(logsDir, `${NODE_ENV}.log`);
const ERROR_LOG_FILE = process.env.ERROR_LOG_FILE || path.join(logsDir, `${NODE_ENV}-error.log`);
const MAX_SIZE = process.env.LOG_MAX_SIZE || '10m';
const MAX_FILES = process.env.LOG_MAX_FILES || 5;

// Custom log format
const customFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  format.errors({ stack: true }),
  format.splat(),
  format.json()
);

// Console format with colors for development
const consoleFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  format.errors({ stack: true }),
  format.splat(),
  format.colorize(),
  format.printf(({ level, message, timestamp, ...meta }) => {
    const metaString = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaString}`;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: LOG_LEVEL,
  format: customFormat,
  defaultMeta: { service: 'voting-system' },
  transports: [
    // Write all logs to console
    new winston.transports.Console({
      format: consoleFormat
    }),
    
    // Write all logs with level 'info' and below to the combined log file
    new winston.transports.File({
      filename: LOG_FILE,
      maxsize: MAX_SIZE,
      maxFiles: MAX_FILES,
      tailable: true
    }),
    
    // Write all logs with level 'error' and below to the error log file
    new winston.transports.File({
      filename: ERROR_LOG_FILE,
      level: 'error',
      maxsize: MAX_SIZE,
      maxFiles: MAX_FILES,
      tailable: true
    })
  ],
  // Exit on error (optional, set to false to handle errors manually)
  exitOnError: false
});

// Add request ID to log context if available
const addRequestId = format((info, opts) => {
  if (opts.requestId) {
    info.requestId = opts.requestId;
  }
  return info;
});

/**
 * Create a logger with request context
 * @param {Object} req Express request object
 * @returns {Object} Logger with request context
 */
logger.createRequestLogger = (req) => {
  const requestId = req.id || 'unknown';
  
  return {
    debug: (message, meta = {}) => logger.debug(message, { ...meta, requestId }),
    info: (message, meta = {}) => logger.info(message, { ...meta, requestId }),
    warn: (message, meta = {}) => logger.warn(message, { ...meta, requestId }),
    error: (message, meta = {}) => logger.error(message, { ...meta, requestId })
  };
};

/**
 * Express middleware for request logging
 * @returns {Function} Express middleware
 */
logger.requestLogger = () => {
  return (req, res, next) => {
    // Generate request ID if not already set
    req.id = req.id || req.headers['x-request-id'] || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Set response header with request ID
    res.setHeader('X-Request-ID', req.id);
    
    // Log request
    logger.info(`${req.method} ${req.originalUrl}`, {
      requestId: req.id,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    // Track response time
    const start = Date.now();
    
    // Log response on finish
    res.on('finish', () => {
      const duration = Date.now() - start;
      const level = res.statusCode >= 400 ? 'warn' : 'info';
      
      logger[level](`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`, {
        requestId: req.id,
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        duration: duration
      });
    });
    
    next();
  };
};

/**
 * Express error logging middleware
 * @returns {Function} Express middleware
 */
logger.errorLogger = () => {
  return (err, req, res, next) => {
    logger.error(`${req.method} ${req.originalUrl} ${err.message}`, {
      requestId: req.id,
      method: req.method,
      url: req.originalUrl,
      error: err.message,
      stack: err.stack
    });
    
    next(err);
  };
};

// Export logger
module.exports = logger;
