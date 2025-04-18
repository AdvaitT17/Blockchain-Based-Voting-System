/**
 * Elections Routes
 * Handles election information endpoints
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
 * @route GET /api/elections/active
 * @desc Get all active elections
 * @access Public
 */
router.get('/active', cacheManager.middleware('elections:active', 300), async (req, res, next) => {
  try {
    logger.info(`Fetching active elections [${req.id}]`);
    
    // Query the blockchain
    try {
      const elections = await fabricConnectionPool.query(
        'votingChaincode',
        'getActiveElections',
        []
      );
      
      logger.info(`Retrieved ${elections.length} active elections [${req.id}]`);
      return res.json({
        success: true,
        message: 'Active elections retrieved successfully',
        data: elections
      });
    } catch (error) {
      logger.error(`Blockchain error during active elections retrieval: ${error.message} [${req.id}]`);
      return res.status(500).json({
        success: false,
        message: 'Error retrieving active elections from the blockchain'
      });
    }
  } catch (error) {
    logger.error(`Get active elections error: ${error.message} [${req.id}]`);
    next(error);
  }
});

/**
 * @route GET /api/elections/:electionId
 * @desc Get election details by ID
 * @access Public
 */
router.get('/:electionId', async (req, res, next) => {
  const { electionId } = req.params;
  
  try {
    if (!electionId) {
      return res.status(400).json({
        success: false,
        message: 'Election ID is required'
      });
    }
    
    // Try to get from cache first
    const cacheKey = `election:${electionId}`;
    const cachedElection = await cacheManager.get(cacheKey);
    
    if (cachedElection) {
      logger.debug(`Election retrieved from cache: ${electionId} [${req.id}]`);
      return res.json({
        success: true,
        message: 'Election retrieved from cache',
        data: cachedElection
      });
    }
    
    // Query the blockchain
    try {
      const election = await fabricConnectionPool.query(
        'votingChaincode',
        'getElection',
        [electionId]
      );
      
      // Cache the result (longer TTL for election details as they don't change often)
      await cacheManager.set(cacheKey, election, 600); // 10 minutes TTL
      
      logger.info(`Election retrieved: ${electionId} [${req.id}]`);
      return res.json({
        success: true,
        message: 'Election retrieved successfully',
        data: election
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
      logger.error(`Blockchain error during election retrieval: ${error.message} [${req.id}]`);
      return res.status(500).json({
        success: false,
        message: 'Error retrieving election from the blockchain'
      });
    }
  } catch (error) {
    logger.error(`Get election error: ${error.message} [${req.id}]`);
    next(error);
  }
});

/**
 * @route GET /api/elections/:electionId/constituencies
 * @desc Get constituencies for an election
 * @access Public
 */
router.get('/:electionId/constituencies', async (req, res, next) => {
  const { electionId } = req.params;
  
  try {
    if (!electionId) {
      return res.status(400).json({
        success: false,
        message: 'Election ID is required'
      });
    }
    
    // Try to get from cache first
    const cacheKey = `election:${electionId}:constituencies`;
    const cachedConstituencies = await cacheManager.get(cacheKey);
    
    if (cachedConstituencies) {
      logger.debug(`Election constituencies retrieved from cache: ${electionId} [${req.id}]`);
      return res.json({
        success: true,
        message: 'Election constituencies retrieved from cache',
        data: cachedConstituencies
      });
    }
    
    // Query the blockchain
    try {
      // First get the election to verify it exists and get constituencies
      const election = await fabricConnectionPool.query(
        'votingChaincode',
        'getElection',
        [electionId]
      );
      
      // Get detailed information for each constituency
      const constituenciesPromises = election.constituencies.map(async (constituencyId) => {
        try {
          return await fabricConnectionPool.query(
            'votingChaincode',
            'getConstituency',
            [constituencyId]
          );
        } catch (error) {
          logger.warn(`Error retrieving constituency ${constituencyId}: ${error.message} [${req.id}]`);
          // Return basic info if detailed info not available
          return { constituencyId, name: 'Unknown' };
        }
      });
      
      const constituencies = await Promise.all(constituenciesPromises);
      
      // Cache the result
      await cacheManager.set(cacheKey, constituencies, 600); // 10 minutes TTL
      
      logger.info(`Election constituencies retrieved: ${electionId} [${req.id}]`);
      return res.json({
        success: true,
        message: 'Election constituencies retrieved successfully',
        data: constituencies
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
      logger.error(`Blockchain error during constituencies retrieval: ${error.message} [${req.id}]`);
      return res.status(500).json({
        success: false,
        message: 'Error retrieving election constituencies from the blockchain'
      });
    }
  } catch (error) {
    logger.error(`Get election constituencies error: ${error.message} [${req.id}]`);
    next(error);
  }
});

/**
 * @route GET /api/elections/constituency/:constituencyId
 * @desc Get elections for a constituency
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
    const cacheKey = `constituency:${constituencyId}:elections`;
    const cachedElections = await cacheManager.get(cacheKey);
    
    if (cachedElections) {
      logger.debug(`Constituency elections retrieved from cache: ${constituencyId} [${req.id}]`);
      return res.json({
        success: true,
        message: 'Constituency elections retrieved from cache',
        data: cachedElections
      });
    }
    
    // Query the blockchain
    try {
      const elections = await fabricConnectionPool.query(
        'votingChaincode',
        'getElectionsByConstituency',
        [constituencyId]
      );
      
      // Cache the result
      await cacheManager.set(cacheKey, elections, 300); // 5 minutes TTL
      
      logger.info(`Constituency elections retrieved: ${constituencyId} [${req.id}]`);
      return res.json({
        success: true,
        message: 'Constituency elections retrieved successfully',
        data: elections
      });
    } catch (error) {
      logger.error(`Blockchain error during constituency elections retrieval: ${error.message} [${req.id}]`);
      return res.status(500).json({
        success: false,
        message: 'Error retrieving constituency elections from the blockchain'
      });
    }
  } catch (error) {
    logger.error(`Get constituency elections error: ${error.message} [${req.id}]`);
    next(error);
  }
});

/**
 * @route GET /api/elections/:electionId/results
 * @desc Get election results
 * @access Public
 */
router.get('/:electionId/results', async (req, res, next) => {
  const { electionId } = req.params;
  
  try {
    if (!electionId) {
      return res.status(400).json({
        success: false,
        message: 'Election ID is required'
      });
    }
    
    // Try to get from cache first
    const cacheKey = `election:${electionId}:results`;
    const cachedResults = await cacheManager.get(cacheKey);
    
    if (cachedResults) {
      logger.debug(`Election results retrieved from cache: ${electionId} [${req.id}]`);
      return res.json({
        success: true,
        message: 'Election results retrieved from cache',
        data: cachedResults
      });
    }
    
    // Query the blockchain
    try {
      // First get the election to verify it exists and check status
      const election = await fabricConnectionPool.query(
        'votingChaincode',
        'getElection',
        [electionId]
      );
      
      // Check if election has ended
      if (election.status !== 'ENDED') {
        logger.warn(`Results requested for active election: ${electionId} [${req.id}]`);
        return res.status(400).json({
          success: false,
          message: 'Cannot retrieve results for an election that has not ended'
        });
      }
      
      // Get all candidates for this election
      const candidates = await fabricConnectionPool.query(
        'votingChaincode',
        'getCandidatesByElection',
        [electionId]
      );
      
      // Get vote counts for each candidate
      const resultsPromises = candidates.map(async (candidate) => {
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
          constituencyName: candidate.constituencyName,
          voteCount: parseInt(voteCount, 10) || 0
        };
      });
      
      const results = await Promise.all(resultsPromises);
      
      // Sort results by vote count in descending order
      results.sort((a, b) => b.voteCount - a.voteCount);
      
      // Calculate total votes
      const totalVotes = results.reduce((sum, candidate) => sum + candidate.voteCount, 0);
      
      // Calculate percentages
      const resultsWithPercentage = results.map(candidate => ({
        ...candidate,
        percentage: totalVotes > 0 ? (candidate.voteCount / totalVotes) * 100 : 0
      }));
      
      // Prepare response data
      const responseData = {
        electionId: electionId,
        name: election.name,
        status: election.status,
        totalVotes: totalVotes,
        results: resultsWithPercentage,
        timestamp: new Date().toISOString()
      };
      
      // Cache the result (longer TTL for results as they don't change after election ends)
      await cacheManager.set(cacheKey, responseData, 1800); // 30 minutes TTL
      
      logger.info(`Election results retrieved: ${electionId} [${req.id}]`);
      return res.json({
        success: true,
        message: 'Election results retrieved successfully',
        data: responseData
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
      logger.error(`Blockchain error during results retrieval: ${error.message} [${req.id}]`);
      return res.status(500).json({
        success: false,
        message: 'Error retrieving election results from the blockchain'
      });
    }
  } catch (error) {
    logger.error(`Get election results error: ${error.message} [${req.id}]`);
    next(error);
  }
});

module.exports = router;
