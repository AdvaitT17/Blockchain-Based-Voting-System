/**
 * Voting Routes
 * Handles vote casting and voting statistics
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const logger = require('../../utils/logger');
// Use mock or real implementation based on environment
const fabricConnectionPool = process.env.NODE_ENV === 'production'
  ? require('../../utils/fabric-connection-pool')
  : require('../utils/mock-fabric-connection');
// Use mock or real implementation based on environment
const cacheManager = process.env.NODE_ENV === 'production'
  ? require('../../utils/cache-manager')
  : require('../utils/mock-cache-manager');

// Hash sensitive data
function hashData(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * @route POST /api/voting/cast
 * @desc Cast a vote in an election
 * @access Public
 */
router.post('/cast', async (req, res, next) => {
  const { electionId, candidateId, voterId, pollingStationId } = req.body;
  
  try {
    // Validate input
    if (!electionId || !candidateId || !voterId || !pollingStationId) {
      return res.status(400).json({
        success: false,
        message: 'Election ID, candidate ID, voter ID, and polling station ID are required'
      });
    }
    
    // Hash voter ID
    const voterIdHash = hashData(voterId);
    
    logger.info(`Casting vote: Voter ${voterIdHash.substring(0, 10)}... for election ${electionId} [${req.id}]`);
    
    // First check if voter has already voted
    try {
      const hasVoted = await fabricConnectionPool.query(
        'votingChaincode',
        'hasVoted',
        [electionId, voterIdHash]
      );
      
      if (hasVoted === 'true') {
        logger.warn(`Vote rejected: Voter ${voterIdHash.substring(0, 10)}... has already voted in election ${electionId} [${req.id}]`);
        return res.status(400).json({
          success: false,
          message: 'Voter has already voted in this election',
          data: {
            success: false
          }
        });
      }
    } catch (error) {
      // If there's an error checking voting status, continue with caution
      logger.warn(`Error checking if voter has voted: ${error.message} [${req.id}]`);
    }
    
    // Check if election is active
    try {
      const election = await fabricConnectionPool.query(
        'votingChaincode',
        'getElection',
        [electionId]
      );
      
      if (election.status !== 'ACTIVE') {
        logger.warn(`Vote rejected: Election ${electionId} is not active (Status: ${election.status}) [${req.id}]`);
        return res.status(400).json({
          success: false,
          message: `Election is not active (Status: ${election.status})`,
          data: {
            success: false
          }
        });
      }
    } catch (error) {
      // If election doesn't exist or other error
      logger.error(`Error checking election status: ${error.message} [${req.id}]`);
      return res.status(400).json({
        success: false,
        message: 'Invalid election ID or error checking election status',
        data: {
          success: false
        }
      });
    }
    
    // Cast vote on the blockchain
    try {
      // Submit transaction to cast vote
      const result = await fabricConnectionPool.submit(
        'votingChaincode',
        'castVote',
        [electionId, candidateId, voterIdHash, pollingStationId]
      );
      
      // Invalidate voter status cache
      const cacheKey = `voter:status:${voterIdHash}`;
      await cacheManager.delete(cacheKey);
      
      // Invalidate election statistics cache
      await cacheManager.deletePattern(`election:stats:${electionId}*`);
      await cacheManager.deletePattern(`polling-station:stats:${pollingStationId}*`);
      
      logger.info(`Vote cast successfully: Voter ${voterIdHash.substring(0, 10)}... for election ${electionId} [${req.id}]`);
      
      return res.status(201).json({
        success: true,
        message: 'Vote cast successfully',
        data: {
          success: true,
          transactionId: result.txId || result.transactionId || 'unknown',
          timestamp: new Date().toISOString(),
          electionId: electionId
        }
      });
    } catch (error) {
      // Handle specific error cases
      if (error.message) {
        if (error.message.includes('already voted')) {
          logger.warn(`Vote rejected: Voter ${voterIdHash.substring(0, 10)}... has already voted in election ${electionId} [${req.id}]`);
          return res.status(400).json({
            success: false,
            message: 'Voter has already voted in this election',
            data: {
              success: false
            }
          });
        } else if (error.message.includes('not eligible')) {
          logger.warn(`Vote rejected: Voter ${voterIdHash.substring(0, 10)}... is not eligible to vote [${req.id}]`);
          return res.status(403).json({
            success: false,
            message: 'Voter is not eligible to vote',
            data: {
              success: false
            }
          });
        } else if (error.message.includes('election not active')) {
          logger.warn(`Vote rejected: Election ${electionId} is not active [${req.id}]`);
          return res.status(400).json({
            success: false,
            message: 'Election is not currently active',
            data: {
              success: false
            }
          });
        } else if (error.message.includes('invalid candidate')) {
          logger.warn(`Vote rejected: Invalid candidate ${candidateId} for election ${electionId} [${req.id}]`);
          return res.status(400).json({
            success: false,
            message: 'Invalid candidate for this election',
            data: {
              success: false
            }
          });
        }
      }
      
      // Generic blockchain error
      logger.error(`Blockchain error during vote casting: ${error.message} [${req.id}]`);
      return res.status(500).json({
        success: false,
        message: 'Error casting vote on the blockchain',
        data: {
          success: false
        }
      });
    }
  } catch (error) {
    logger.error(`Vote casting error: ${error.message} [${req.id}]`);
    next(error);
  }
});

/**
 * @route GET /api/voting/statistics/:electionId
 * @desc Get voting statistics for an election
 * @access Public
 */
router.get('/statistics/:electionId', async (req, res, next) => {
  const { electionId } = req.params;
  
  try {
    if (!electionId) {
      return res.status(400).json({
        success: false,
        message: 'Election ID is required'
      });
    }
    
    // Try to get from cache first
    const cacheKey = `election:stats:${electionId}`;
    const cachedStats = await cacheManager.get(cacheKey);
    
    if (cachedStats) {
      logger.debug(`Election statistics retrieved from cache: ${electionId} [${req.id}]`);
      return res.json({
        success: true,
        message: 'Election statistics retrieved from cache',
        data: cachedStats
      });
    }
    
    // Query the blockchain
    try {
      // Get election details
      const election = await fabricConnectionPool.query(
        'votingChaincode',
        'getElection',
        [electionId]
      );
      
      // Get vote counts for each candidate
      const candidates = await fabricConnectionPool.query(
        'votingChaincode',
        'getCandidatesByElection',
        [electionId]
      );
      
      // Get vote counts for each candidate
      const candidateStats = await Promise.all(
        candidates.map(async (candidate) => {
          const voteCount = await fabricConnectionPool.query(
            'votingChaincode',
            'getCandidateVoteCount',
            [electionId, candidate.candidateId]
          );
          
          return {
            candidateId: candidate.candidateId,
            name: candidate.name,
            party: candidate.party,
            constituencyId: candidate.constituencyId,
            voteCount: parseInt(voteCount, 10) || 0
          };
        })
      );
      
      // Calculate total votes
      const totalVotes = candidateStats.reduce((sum, candidate) => sum + candidate.voteCount, 0);
      
      // Prepare statistics
      const statistics = {
        electionId: electionId,
        name: election.name,
        status: election.status,
        startTime: election.startTime,
        endTime: election.endTime,
        totalVotes: totalVotes,
        candidates: candidateStats,
        lastUpdated: new Date().toISOString()
      };
      
      // Cache the result (5 minutes TTL for statistics)
      await cacheManager.set(cacheKey, statistics, 300); // 5 minutes TTL
      
      logger.info(`Election statistics retrieved: ${electionId} [${req.id}]`);
      return res.json({
        success: true,
        message: 'Election statistics retrieved successfully',
        data: statistics
      });
    } catch (error) {
      // Check if election not found
      if (error.message && error.message.includes('does not exist')) {
        logger.warn(`Election not found: ${electionId} [${req.id}]`);
        return res.status(404).json({
          success: false,
          message: 'Election not found'
        });
      }
      
      // Other blockchain errors
      logger.error(`Blockchain error during statistics retrieval: ${error.message} [${req.id}]`);
      return res.status(500).json({
        success: false,
        message: 'Error retrieving election statistics from the blockchain'
      });
    }
  } catch (error) {
    logger.error(`Get election statistics error: ${error.message} [${req.id}]`);
    next(error);
  }
});

/**
 * @route GET /api/voting/statistics/:electionId/constituency/:constituencyId
 * @desc Get voting statistics for a constituency in an election
 * @access Public
 */
router.get('/statistics/:electionId/constituency/:constituencyId', async (req, res, next) => {
  const { electionId, constituencyId } = req.params;
  
  try {
    if (!electionId || !constituencyId) {
      return res.status(400).json({
        success: false,
        message: 'Election ID and constituency ID are required'
      });
    }
    
    // Try to get from cache first
    const cacheKey = `election:stats:${electionId}:constituency:${constituencyId}`;
    const cachedStats = await cacheManager.get(cacheKey);
    
    if (cachedStats) {
      logger.debug(`Constituency statistics retrieved from cache: ${electionId}/${constituencyId} [${req.id}]`);
      return res.json({
        success: true,
        message: 'Constituency statistics retrieved from cache',
        data: cachedStats
      });
    }
    
    // Query the blockchain
    try {
      // Get candidates for this constituency
      const candidates = await fabricConnectionPool.query(
        'votingChaincode',
        'getCandidatesByConstituency',
        [electionId, constituencyId]
      );
      
      // Get vote counts for each candidate
      const candidateStats = await Promise.all(
        candidates.map(async (candidate) => {
          const voteCount = await fabricConnectionPool.query(
            'votingChaincode',
            'getCandidateVoteCount',
            [electionId, candidate.candidateId]
          );
          
          return {
            candidateId: candidate.candidateId,
            name: candidate.name,
            party: candidate.party,
            voteCount: parseInt(voteCount, 10) || 0
          };
        })
      );
      
      // Calculate total votes
      const totalVotes = candidateStats.reduce((sum, candidate) => sum + candidate.voteCount, 0);
      
      // Prepare statistics
      const statistics = {
        electionId: electionId,
        constituencyId: constituencyId,
        totalVotes: totalVotes,
        candidates: candidateStats,
        lastUpdated: new Date().toISOString()
      };
      
      // Cache the result (5 minutes TTL for statistics)
      await cacheManager.set(cacheKey, statistics, 300); // 5 minutes TTL
      
      logger.info(`Constituency statistics retrieved: ${electionId}/${constituencyId} [${req.id}]`);
      return res.json({
        success: true,
        message: 'Constituency statistics retrieved successfully',
        data: statistics
      });
    } catch (error) {
      // Handle specific errors
      if (error.message) {
        if (error.message.includes('does not exist')) {
          logger.warn(`Election or constituency not found: ${electionId}/${constituencyId} [${req.id}]`);
          return res.status(404).json({
            success: false,
            message: 'Election or constituency not found'
          });
        }
      }
      
      // Other blockchain errors
      logger.error(`Blockchain error during constituency statistics retrieval: ${error.message} [${req.id}]`);
      return res.status(500).json({
        success: false,
        message: 'Error retrieving constituency statistics from the blockchain'
      });
    }
  } catch (error) {
    logger.error(`Get constituency statistics error: ${error.message} [${req.id}]`);
    next(error);
  }
});

/**
 * @route GET /api/polling-stations/:stationId/stats
 * @desc Get voting statistics for a polling station
 * @access Public
 */
router.get('/polling-stations/:stationId/stats', async (req, res, next) => {
  const { stationId } = req.params;
  
  try {
    if (!stationId) {
      return res.status(400).json({
        success: false,
        message: 'Polling station ID is required'
      });
    }
    
    // Try to get from cache first
    const cacheKey = `polling-station:stats:${stationId}`;
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

module.exports = router;
