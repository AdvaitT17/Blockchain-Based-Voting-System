/**
 * Polling Stations Routes
 * Handles polling station information endpoints
 */

const express = require('express');
const router = express.Router();
const logger = require('../../utils/logger');
// Use mock or real implementation based on environment
const fabricConnectionPool = process.env.NODE_ENV === 'production'
  ? require('../../utils/fabric-connection-pool')
  : require('../utils/mock-fabric-connection');
// Use mock or real implementation based on environment
const cacheManager = process.env.NODE_ENV === 'production'
  ? require('../../utils/cache-manager')
  : require('../utils/mock-cache-manager');

/**
 * @route GET /api/polling-stations/constituency/:constituencyId
 * @desc Get polling stations for a constituency
 * @access Public
 */
router.get('/constituency/:constituencyId', async (req, res, next) => {
  const { constituencyId } = req.params;
  
  try {
    if (!constituencyId) {
      return res.status(400).json({
        success: false,
        message: 'Constituency ID is required'
      });
    }
    
    // Try to get from cache first
    const cacheKey = `constituency:${constituencyId}:polling-stations`;
    const cachedStations = await cacheManager.get(cacheKey);
    
    if (cachedStations) {
      logger.debug(`Constituency polling stations retrieved from cache: ${constituencyId} [${req.id}]`);
      return res.json({
        success: true,
        message: 'Constituency polling stations retrieved from cache',
        data: cachedStations
      });
    }
    
    // Query the blockchain
    try {
      const pollingStations = await fabricConnectionPool.query(
        'votingChaincode',
        'getPollingStationsByConstituency',
        [constituencyId]
      );
      
      // Cache the result
      await cacheManager.set(cacheKey, pollingStations, 1800); // 30 minutes TTL (polling stations change rarely)
      
      logger.info(`Constituency polling stations retrieved: ${constituencyId} [${req.id}]`);
      return res.json({
        success: true,
        message: 'Constituency polling stations retrieved successfully',
        data: pollingStations
      });
    } catch (error) {
      logger.error(`Blockchain error during constituency polling stations retrieval: ${error.message} [${req.id}]`);
      return res.status(500).json({
        success: false,
        message: 'Error retrieving constituency polling stations from the blockchain'
      });
    }
  } catch (error) {
    logger.error(`Get constituency polling stations error: ${error.message} [${req.id}]`);
    next(error);
  }
});

/**
 * @route GET /api/polling-stations/:stationId
 * @desc Get polling station details by ID
 * @access Public
 */
router.get('/:stationId', async (req, res, next) => {
  const { stationId } = req.params;
  
  try {
    if (!stationId) {
      return res.status(400).json({
        success: false,
        message: 'Polling station ID is required'
      });
    }
    
    // Try to get from cache first
    const cacheKey = `polling-station:${stationId}`;
    const cachedStation = await cacheManager.get(cacheKey);
    
    if (cachedStation) {
      logger.debug(`Polling station retrieved from cache: ${stationId} [${req.id}]`);
      return res.json({
        success: true,
        message: 'Polling station retrieved from cache',
        data: cachedStation
      });
    }
    
    // Query the blockchain
    try {
      const pollingStation = await fabricConnectionPool.query(
        'votingChaincode',
        'getPollingStation',
        [stationId]
      );
      
      // Cache the result
      await cacheManager.set(cacheKey, pollingStation, 1800); // 30 minutes TTL
      
      logger.info(`Polling station retrieved: ${stationId} [${req.id}]`);
      return res.json({
        success: true,
        message: 'Polling station retrieved successfully',
        data: pollingStation
      });
    } catch (error) {
      // Check if polling station not found
      if (error.message && error.message.includes('does not exist')) {
        logger.warn(`Polling station not found: ${stationId} [${req.id}]`);
        return res.status(404).json({
          success: false,
          message: 'Polling station not found'
        });
      }
      
      // Other blockchain errors
      logger.error(`Blockchain error during polling station retrieval: ${error.message} [${req.id}]`);
      return res.status(500).json({
        success: false,
        message: 'Error retrieving polling station from the blockchain'
      });
    }
  } catch (error) {
    logger.error(`Get polling station error: ${error.message} [${req.id}]`);
    next(error);
  }
});

/**
 * @route GET /api/polling-stations/:stationId/stats
 * @desc Get statistics for a polling station
 * @access Public
 */
router.get('/:stationId/stats', async (req, res, next) => {
  const { stationId } = req.params;
  
  try {
    if (!stationId) {
      return res.status(400).json({
        success: false,
        message: 'Polling station ID is required'
      });
    }
    
    // Try to get from cache first
    const cacheKey = `polling-station:${stationId}:stats`;
    const cachedStats = await cacheManager.get(cacheKey);
    
    if (cachedStats) {
      logger.debug(`Polling station statistics retrieved from cache: ${stationId} [${req.id}]`);
      return res.json({
        success: true,
        message: 'Polling station statistics retrieved from cache',
        data: cachedStats
      });
    }
    
    // Query the blockchain
    try {
      // Get polling station details
      const pollingStation = await fabricConnectionPool.query(
        'votingChaincode',
        'getPollingStation',
        [stationId]
      );
      
      // Get registered voters count for this constituency
      const registeredVoters = await fabricConnectionPool.query(
        'identityChaincode',
        'getVoterCountByConstituency',
        [pollingStation.constituencyId]
      );
      
      // Get votes cast at this polling station
      const votesCast = await fabricConnectionPool.query(
        'votingChaincode',
        'getVoteCountByPollingStation',
        [stationId]
      );
      
      // Get verification count
      const verificationCount = await fabricConnectionPool.query(
        'identityChaincode',
        'getVerificationCountByPollingStation',
        [stationId]
      );
      
      // Get rejection count
      const rejectionCount = await fabricConnectionPool.query(
        'identityChaincode',
        'getRejectionCountByPollingStation',
        [stationId]
      );
      
      // Calculate statistics
      const totalVoters = parseInt(registeredVoters, 10) || 0;
      const votedCount = parseInt(votesCast, 10) || 0;
      const pendingCount = totalVoters - votedCount;
      const percentageVoted = totalVoters > 0 ? (votedCount / totalVoters) * 100 : 0;
      
      // Prepare statistics
      const statistics = {
        pollingStationId: stationId,
        name: pollingStation.name,
        location: pollingStation.location,
        constituencyId: pollingStation.constituencyId,
        constituencyName: pollingStation.constituencyName,
        stats: {
          totalVoters: totalVoters,
          votedCount: votedCount,
          pendingCount: pendingCount,
          verificationCount: parseInt(verificationCount, 10) || 0,
          rejectionCount: parseInt(rejectionCount, 10) || 0,
          percentageVoted: percentageVoted
        },
        lastUpdated: new Date().toISOString()
      };
      
      // Cache the result (2 minutes TTL for polling station statistics)
      await cacheManager.set(cacheKey, statistics, 120); // 2 minutes TTL
      
      logger.info(`Polling station statistics retrieved: ${stationId} [${req.id}]`);
      return res.json({
        success: true,
        message: 'Polling station statistics retrieved successfully',
        data: statistics
      });
    } catch (error) {
      // Check if polling station not found
      if (error.message && error.message.includes('does not exist')) {
        logger.warn(`Polling station not found: ${stationId} [${req.id}]`);
        return res.status(404).json({
          success: false,
          message: 'Polling station not found'
        });
      }
      
      // Other blockchain errors
      logger.error(`Blockchain error during polling station statistics retrieval: ${error.message} [${req.id}]`);
      return res.status(500).json({
        success: false,
        message: 'Error retrieving polling station statistics from the blockchain'
      });
    }
  } catch (error) {
    logger.error(`Get polling station statistics error: ${error.message} [${req.id}]`);
    next(error);
  }
});

/**
 * @route GET /api/polling-stations/:stationId/active-elections
 * @desc Get active elections for a polling station
 * @access Public
 */
router.get('/:stationId/active-elections', async (req, res, next) => {
  const { stationId } = req.params;
  
  try {
    if (!stationId) {
      return res.status(400).json({
        success: false,
        message: 'Polling station ID is required'
      });
    }
    
    // Try to get from cache first
    const cacheKey = `polling-station:${stationId}:active-elections`;
    const cachedElections = await cacheManager.get(cacheKey);
    
    if (cachedElections) {
      logger.debug(`Polling station active elections retrieved from cache: ${stationId} [${req.id}]`);
      return res.json({
        success: true,
        message: 'Polling station active elections retrieved from cache',
        data: cachedElections
      });
    }
    
    // Query the blockchain
    try {
      // Get polling station details
      const pollingStation = await fabricConnectionPool.query(
        'votingChaincode',
        'getPollingStation',
        [stationId]
      );
      
      // Get active elections for this constituency
      const elections = await fabricConnectionPool.query(
        'votingChaincode',
        'getElectionsByConstituency',
        [pollingStation.constituencyId]
      );
      
      // Filter for active elections
      const activeElections = elections.filter(election => election.status === 'ACTIVE');
      
      // Cache the result
      await cacheManager.set(cacheKey, activeElections, 300); // 5 minutes TTL
      
      logger.info(`Polling station active elections retrieved: ${stationId} [${req.id}]`);
      return res.json({
        success: true,
        message: 'Polling station active elections retrieved successfully',
        data: activeElections
      });
    } catch (error) {
      // Check if polling station not found
      if (error.message && error.message.includes('does not exist')) {
        logger.warn(`Polling station not found: ${stationId} [${req.id}]`);
        return res.status(404).json({
          success: false,
          message: 'Polling station not found'
        });
      }
      
      // Other blockchain errors
      logger.error(`Blockchain error during polling station active elections retrieval: ${error.message} [${req.id}]`);
      return res.status(500).json({
        success: false,
        message: 'Error retrieving polling station active elections from the blockchain'
      });
    }
  } catch (error) {
    logger.error(`Get polling station active elections error: ${error.message} [${req.id}]`);
    next(error);
  }
});

/**
 * @route GET /api/polling-stations/:stationId/hourly-stats
 * @desc Get hourly voting statistics for a polling station
 * @access Public
 */
router.get('/:stationId/hourly-stats', async (req, res, next) => {
  const { stationId } = req.params;
  
  try {
    if (!stationId) {
      return res.status(400).json({
        success: false,
        message: 'Polling station ID is required'
      });
    }
    
    // Try to get from cache first
    const cacheKey = `polling-station:${stationId}:hourly-stats`;
    const cachedStats = await cacheManager.get(cacheKey);
    
    if (cachedStats) {
      logger.debug(`Polling station hourly statistics retrieved from cache: ${stationId} [${req.id}]`);
      return res.json({
        success: true,
        message: 'Polling station hourly statistics retrieved from cache',
        data: cachedStats
      });
    }
    
    // Query the blockchain
    try {
      const hourlyStats = await fabricConnectionPool.query(
        'votingChaincode',
        'getHourlyVotesByPollingStation',
        [stationId]
      );
      
      // Format the hourly stats
      const formattedStats = hourlyStats.map(stat => ({
        hour: stat.hour,
        count: parseInt(stat.count, 10) || 0
      }));
      
      // Cache the result
      await cacheManager.set(cacheKey, formattedStats, 300); // 5 minutes TTL
      
      logger.info(`Polling station hourly statistics retrieved: ${stationId} [${req.id}]`);
      return res.json({
        success: true,
        message: 'Polling station hourly statistics retrieved successfully',
        data: formattedStats
      });
    } catch (error) {
      // Check if polling station not found
      if (error.message && error.message.includes('does not exist')) {
        logger.warn(`Polling station not found: ${stationId} [${req.id}]`);
        return res.status(404).json({
          success: false,
          message: 'Polling station not found'
        });
      }
      
      // Other blockchain errors
      logger.error(`Blockchain error during polling station hourly statistics retrieval: ${error.message} [${req.id}]`);
      return res.status(500).json({
        success: false,
        message: 'Error retrieving polling station hourly statistics from the blockchain'
      });
    }
  } catch (error) {
    logger.error(`Get polling station hourly statistics error: ${error.message} [${req.id}]`);
    next(error);
  }
});

module.exports = router;
