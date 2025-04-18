/**
 * Candidates Routes
 * Handles candidate information endpoints
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
 * @route GET /api/candidates/election/:electionId
 * @desc Get candidates for an election
 * @access Public
 */
router.get('/election/:electionId', async (req, res, next) => {
  const { electionId } = req.params;
  
  try {
    if (!electionId) {
      return res.status(400).json({
        success: false,
        message: 'Election ID is required'
      });
    }
    
    // Try to get from cache first
    const cacheKey = `election:${electionId}:candidates`;
    const cachedCandidates = await cacheManager.get(cacheKey);
    
    if (cachedCandidates) {
      logger.debug(`Election candidates retrieved from cache: ${electionId} [${req.id}]`);
      return res.json({
        success: true,
        message: 'Election candidates retrieved from cache',
        data: cachedCandidates
      });
    }
    
    // Query the blockchain
    try {
      const candidates = await fabricConnectionPool.query(
        'votingChaincode',
        'getCandidatesByElection',
        [electionId]
      );
      
      // Cache the result
      await cacheManager.set(cacheKey, candidates, 600); // 10 minutes TTL
      
      logger.info(`Election candidates retrieved: ${electionId} [${req.id}]`);
      return res.json({
        success: true,
        message: 'Election candidates retrieved successfully',
        data: candidates
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
      logger.error(`Blockchain error during candidates retrieval: ${error.message} [${req.id}]`);
      return res.status(500).json({
        success: false,
        message: 'Error retrieving election candidates from the blockchain'
      });
    }
  } catch (error) {
    logger.error(`Get election candidates error: ${error.message} [${req.id}]`);
    next(error);
  }
});

/**
 * @route GET /api/candidates/constituency/:constituencyId
 * @desc Get candidates for a constituency
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
    const cacheKey = `constituency:${constituencyId}:candidates`;
    const cachedCandidates = await cacheManager.get(cacheKey);
    
    if (cachedCandidates) {
      logger.debug(`Constituency candidates retrieved from cache: ${constituencyId} [${req.id}]`);
      return res.json({
        success: true,
        message: 'Constituency candidates retrieved from cache',
        data: cachedCandidates
      });
    }
    
    // Query the blockchain
    try {
      // Get active elections for this constituency
      const elections = await fabricConnectionPool.query(
        'votingChaincode',
        'getElectionsByConstituency',
        [constituencyId]
      );
      
      // Filter for active elections
      const activeElections = elections.filter(election => election.status === 'ACTIVE');
      
      // Get candidates for each active election in this constituency
      const candidatesPromises = activeElections.map(async (election) => {
        try {
          return await fabricConnectionPool.query(
            'votingChaincode',
            'getCandidatesByConstituency',
            [election.electionId, constituencyId]
          );
        } catch (error) {
          logger.warn(`Error retrieving candidates for election ${election.electionId}: ${error.message} [${req.id}]`);
          return [];
        }
      });
      
      // Flatten the array of candidate arrays
      const candidatesArrays = await Promise.all(candidatesPromises);
      const candidates = candidatesArrays.flat();
      
      // Cache the result
      await cacheManager.set(cacheKey, candidates, 300); // 5 minutes TTL
      
      logger.info(`Constituency candidates retrieved: ${constituencyId} [${req.id}]`);
      return res.json({
        success: true,
        message: 'Constituency candidates retrieved successfully',
        data: candidates
      });
    } catch (error) {
      logger.error(`Blockchain error during constituency candidates retrieval: ${error.message} [${req.id}]`);
      return res.status(500).json({
        success: false,
        message: 'Error retrieving constituency candidates from the blockchain'
      });
    }
  } catch (error) {
    logger.error(`Get constituency candidates error: ${error.message} [${req.id}]`);
    next(error);
  }
});

/**
 * @route GET /api/candidates/:candidateId
 * @desc Get candidate details by ID
 * @access Public
 */
router.get('/:candidateId', async (req, res, next) => {
  const { candidateId } = req.params;
  
  try {
    if (!candidateId) {
      return res.status(400).json({
        success: false,
        message: 'Candidate ID is required'
      });
    }
    
    // Try to get from cache first
    const cacheKey = `candidate:${candidateId}`;
    const cachedCandidate = await cacheManager.get(cacheKey);
    
    if (cachedCandidate) {
      logger.debug(`Candidate retrieved from cache: ${candidateId} [${req.id}]`);
      return res.json({
        success: true,
        message: 'Candidate retrieved from cache',
        data: cachedCandidate
      });
    }
    
    // Query the blockchain
    try {
      const candidate = await fabricConnectionPool.query(
        'votingChaincode',
        'getCandidate',
        [candidateId]
      );
      
      // Cache the result
      await cacheManager.set(cacheKey, candidate, 600); // 10 minutes TTL
      
      logger.info(`Candidate retrieved: ${candidateId} [${req.id}]`);
      return res.json({
        success: true,
        message: 'Candidate retrieved successfully',
        data: candidate
      });
    } catch (error) {
      // Check if candidate not found
      if (error.message && error.message.includes('does not exist')) {
        logger.warn(`Candidate not found: ${candidateId} [${req.id}]`);
        return res.status(404).json({
          success: false,
          message: 'Candidate not found'
        });
      }
      
      // Other blockchain errors
      logger.error(`Blockchain error during candidate retrieval: ${error.message} [${req.id}]`);
      return res.status(500).json({
        success: false,
        message: 'Error retrieving candidate from the blockchain'
      });
    }
  } catch (error) {
    logger.error(`Get candidate error: ${error.message} [${req.id}]`);
    next(error);
  }
});

/**
 * @route GET /api/candidates/election/:electionId/constituency/:constituencyId
 * @desc Get candidates for a specific election and constituency
 * @access Public
 */
router.get('/election/:electionId/constituency/:constituencyId', async (req, res, next) => {
  const { electionId, constituencyId } = req.params;
  
  try {
    if (!electionId || !constituencyId) {
      return res.status(400).json({
        success: false,
        message: 'Election ID and Constituency ID are required'
      });
    }
    
    // Try to get from cache first
    const cacheKey = `election:${electionId}:constituency:${constituencyId}:candidates`;
    const cachedCandidates = await cacheManager.get(cacheKey);
    
    if (cachedCandidates) {
      logger.debug(`Election constituency candidates retrieved from cache: ${electionId}/${constituencyId} [${req.id}]`);
      return res.json({
        success: true,
        message: 'Election constituency candidates retrieved from cache',
        data: cachedCandidates
      });
    }
    
    // Query the blockchain
    try {
      const candidates = await fabricConnectionPool.query(
        'votingChaincode',
        'getCandidatesByConstituency',
        [electionId, constituencyId]
      );
      
      // Cache the result
      await cacheManager.set(cacheKey, candidates, 300); // 5 minutes TTL
      
      logger.info(`Election constituency candidates retrieved: ${electionId}/${constituencyId} [${req.id}]`);
      return res.json({
        success: true,
        message: 'Election constituency candidates retrieved successfully',
        data: candidates
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
      logger.error(`Blockchain error during election constituency candidates retrieval: ${error.message} [${req.id}]`);
      return res.status(500).json({
        success: false,
        message: 'Error retrieving election constituency candidates from the blockchain'
      });
    }
  } catch (error) {
    logger.error(`Get election constituency candidates error: ${error.message} [${req.id}]`);
    next(error);
  }
});

module.exports = router;
