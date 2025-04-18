/**
 * Voters Routes
 * Handles voter verification and status endpoints
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
 * @route POST /api/voters/verify
 * @desc Verify voter credentials
 * @access Public
 */
router.post('/verify', async (req, res, next) => {
  const { voterId, aadharNumber } = req.body;
  
  try {
    // Validate input
    if (!voterId || !aadharNumber) {
      return res.status(400).json({
        success: false,
        message: 'Voter ID and Aadhar Number are required'
      });
    }
    
    // Hash sensitive data
    const voterIdHash = hashData(voterId);
    const aadharHash = hashData(aadharNumber);
    
    logger.info(`Verifying voter: ${voterIdHash.substring(0, 10)}... [${req.id}]`);
    
    // Query the blockchain
    try {
      // First check if voter exists
      const voter = await fabricConnectionPool.query(
        'identityChaincode',
        'getVoter',
        [voterIdHash]
      );
      
      // Verify Aadhar hash matches
      if (voter.aadharHash !== aadharHash) {
        logger.warn(`Voter verification failed: Aadhar mismatch for ${voterIdHash.substring(0, 10)}... [${req.id}]`);
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
          data: {
            valid: false
          }
        });
      }
      
      // Check eligibility
      if (voter.eligibilityStatus !== 'ELIGIBLE') {
        logger.warn(`Voter not eligible: ${voterIdHash.substring(0, 10)}... [${req.id}]`);
        return res.status(403).json({
          success: false,
          message: `Voter is not eligible (Status: ${voter.eligibilityStatus})`,
          data: {
            valid: false
          }
        });
      }
      
      // Return successful verification
      logger.info(`Voter verified successfully: ${voterIdHash.substring(0, 10)}... [${req.id}]`);
      return res.json({
        success: true,
        message: 'Voter verified successfully',
        data: {
          valid: true,
          voter: {
            voterId: voterId,
            voterIdHash: voterIdHash,
            aadharHash: aadharHash,
            constituencyId: voter.constituencyId,
            eligibilityStatus: voter.eligibilityStatus,
            hasVoted: voter.hasVoted || false,
            createdAt: voter.createdAt,
            updatedAt: voter.updatedAt
          }
        }
      });
    } catch (error) {
      // Check if voter not found
      if (error.message && error.message.includes('does not exist')) {
        logger.warn(`Voter not found: ${voterIdHash.substring(0, 10)}... [${req.id}]`);
        return res.status(404).json({
          success: false,
          message: 'Voter not found',
          data: {
            valid: false
          }
        });
      }
      
      // Other blockchain errors
      logger.error(`Blockchain error during voter verification: ${error.message} [${req.id}]`);
      return res.status(500).json({
        success: false,
        message: 'Error verifying voter on the blockchain',
        data: {
          valid: false
        }
      });
    }
  } catch (error) {
    logger.error(`Voter verification error: ${error.message} [${req.id}]`);
    next(error);
  }
});

/**
 * @route GET /api/voters/:voterId/status
 * @desc Get voter voting status
 * @access Public
 */
router.get('/:voterId/status', async (req, res, next) => {
  const { voterId } = req.params;
  
  try {
    if (!voterId) {
      return res.status(400).json({
        success: false,
        message: 'Voter ID is required'
      });
    }
    
    // Hash voter ID
    const voterIdHash = hashData(voterId);
    
    // Try to get from cache first
    const cacheKey = `voter:status:${voterIdHash}`;
    const cachedStatus = await cacheManager.get(cacheKey);
    
    if (cachedStatus) {
      logger.debug(`Voter status retrieved from cache: ${voterIdHash.substring(0, 10)}... [${req.id}]`);
      return res.json({
        success: true,
        message: 'Voter status retrieved from cache',
        data: cachedStatus
      });
    }
    
    // Query the blockchain
    try {
      const voter = await fabricConnectionPool.query(
        'identityChaincode',
        'getVoter',
        [voterIdHash]
      );
      
      // Prepare response data
      const statusData = {
        hasVoted: voter.hasVoted || false,
        constituencyId: voter.constituencyId,
        eligibilityStatus: voter.eligibilityStatus
      };
      
      // Cache the result (short TTL for voting status as it may change)
      await cacheManager.set(cacheKey, statusData, 60); // 60 seconds TTL
      
      logger.info(`Voter status retrieved: ${voterIdHash.substring(0, 10)}... [${req.id}]`);
      return res.json({
        success: true,
        message: 'Voter status retrieved successfully',
        data: statusData
      });
    } catch (error) {
      // Check if voter not found
      if (error.message && error.message.includes('does not exist')) {
        logger.warn(`Voter not found: ${voterIdHash.substring(0, 10)}... [${req.id}]`);
        return res.status(404).json({
          success: false,
          message: 'Voter not found'
        });
      }
      
      // Other blockchain errors
      logger.error(`Blockchain error during status retrieval: ${error.message} [${req.id}]`);
      return res.status(500).json({
        success: false,
        message: 'Error retrieving voter status from the blockchain'
      });
    }
  } catch (error) {
    logger.error(`Get voter status error: ${error.message} [${req.id}]`);
    next(error);
  }
});

module.exports = router;
