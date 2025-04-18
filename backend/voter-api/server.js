/**
 * Voter API Server - Simplified Version
 * Handles voter registration and vote casting
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const dotenv = require('dotenv');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

// Custom utilities

// Load environment variables
dotenv.config();

// Determine which blockchain service to use
const useRealBlockchain = process.env.USE_REAL_BLOCKCHAIN === 'true';
const blockchainService = useRealBlockchain 
  ? require('../utils/fabric-blockchain')
  : require('../utils/mock-blockchain');

console.log(`Using ${useRealBlockchain ? 'real' : 'mock'} blockchain service`);

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3003;

// Request ID middleware
app.use((req, res, next) => {
  req.id = req.id || req.headers['x-request-id'] || uuidv4();
  res.setHeader('X-Request-ID', req.id);
  next();
});

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(bodyParser.json()); // Parse JSON bodies

// Simple logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Initialize blockchain service
    await blockchainService.initialize();
    
    res.json({
      status: 'UP',
      timestamp: new Date().toISOString(),
      requestId: req.id,
      services: {
        blockchain: {
          status: 'UP'
        }
      }
    });
  } catch (error) {
    console.error(`Health check failed: ${error.message}`);
    res.status(500).json({
      status: 'DOWN',
      timestamp: new Date().toISOString(),
      requestId: req.id,
      error: error.message
    });
  }
});

// Test connection to blockchain service
app.get('/api/test-connection', async (req, res) => {
  try {
    // Connect to the blockchain service
    const result = await blockchainService.testConnection();
    
    res.json({
      success: true,
      message: 'Successfully connected to the blockchain service',
      timestamp: new Date().toISOString(),
      requestId: req.id
    });
  } catch (error) {
    console.error(`Failed to connect to blockchain service: ${error.message}`);
    res.status(500).json({
      success: false,
      message: error.message,
      timestamp: new Date().toISOString(),
      requestId: req.id
    });
  }
});

// Register a new voter
app.post('/api/voters/register', async (req, res) => {
  try {
    const { voterId, name, aadharId, votingDistrict } = req.body;
    
    console.log('Registration request:', { voterId, name, aadharId, votingDistrict });
    
    if (!voterId || !name || !aadharId || !votingDistrict) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        requestId: req.id
      });
    }
    
    // Register the voter using the blockchain service
    const result = await blockchainService.registerVoter(voterId, name, aadharId, votingDistrict);
    
    console.log('Registration result:', result);
    
    res.json({
      success: true,
      message: `Voter ${voterId} registered successfully`,
      data: result.data || {
        voterId,
        name,
        aadharId,
        votingDistrict,
        constituencyId: votingDistrict, // Add constituency ID for compatibility
        registrationDate: new Date().toISOString(),
        status: 'REGISTERED',
        votedElections: [],
        hasVoted: false
      },
      requestId: req.id
    });
  } catch (error) {
    console.error(`Failed to register voter: ${error.message}`);
    res.status(500).json({
      success: false,
      message: error.message,
      requestId: req.id
    });
  }
});

// Get voter information
app.get('/api/voters/:voterId', async (req, res) => {
  try {
    const { voterId } = req.params;
    
    if (!voterId) {
      return res.status(400).json({
        success: false,
        message: 'Voter ID is required',
        requestId: req.id
      });
    }
    
    // Get voter information from blockchain
    const result = await blockchainService.getVoter(voterId);
    
    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.message,
        requestId: req.id
      });
    }
    
    res.json({
      success: true,
      data: result.data,
      requestId: req.id
    });
  } catch (error) {
    console.error(`Failed to get voter information: ${error.message}`);
    res.status(500).json({
      success: false,
      message: error.message,
      requestId: req.id
    });
  }
});

// Verify voter credentials
app.post('/api/voters/verify', async (req, res) => {
  try {
    const { voterId, aadharNumber } = req.body;
    
    console.log('Verification request:', { voterId, aadharNumber });
    
    if (!voterId || !aadharNumber) {
      return res.status(400).json({
        success: false,
        message: 'Voter ID and Aadhar Number are required',
        requestId: req.id
      });
    }
    
    // Get voter information from blockchain
    const result = await blockchainService.getVoter(voterId);
    
    console.log('Voter data from blockchain:', result);
    
    if (!result.success || !result.data) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        data: { valid: false },
        requestId: req.id
      });
    }
    
    // Verify Aadhar number matches
    if (result.data.aadharId !== aadharNumber) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        data: { valid: false },
        requestId: req.id
      });
    }
    
    // Generate a token
    const token = uuidv4();
    
    res.json({
      success: true,
      message: 'Voter verified successfully',
      data: {
        valid: true,
        voter: result.data,
        token: token
      },
      requestId: req.id
    });
  } catch (error) {
    console.error(`Failed to verify voter: ${error.message}`);
    res.status(500).json({
      success: false,
      message: error.message,
      data: { valid: false },
      requestId: req.id
    });
  }
});

// Cast a vote
app.post('/api/voting/cast', async (req, res) => {
  try {
    const { voterId, electionId, candidateId } = req.body;
    
    if (!voterId || !electionId || !candidateId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        requestId: req.id
      });
    }
    
    // Cast vote using blockchain service
    const result = await blockchainService.castVote(voterId, electionId, candidateId);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
        requestId: req.id
      });
    }
    
    res.json({
      success: true,
      message: 'Vote cast successfully',
      data: result.data,
      requestId: req.id
    });
  } catch (error) {
    console.error(`Failed to cast vote: ${error.message}`);
    res.status(500).json({
      success: false,
      message: error.message,
      requestId: req.id
    });
  }
});

// Get all elections
app.get('/api/elections', async (req, res) => {
  try {
    // Get all elections from blockchain
    const result = await blockchainService.getAllElections();
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
        requestId: req.id
      });
    }
    
    res.json({
      success: true,
      data: result.data,
      requestId: req.id
    });
  } catch (error) {
    console.error(`Failed to get elections: ${error.message}`);
    res.status(500).json({
      success: false,
      message: error.message,
      requestId: req.id
    });
  }
});

// Get election by ID
app.get('/api/elections/:electionId', async (req, res) => {
  try {
    const { electionId } = req.params;
    
    if (!electionId) {
      return res.status(400).json({
        success: false,
        message: 'Election ID is required',
        requestId: req.id
      });
    }
    
    // Get election from blockchain
    const result = await blockchainService.getElection(electionId);
    
    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.message,
        requestId: req.id
      });
    }
    
    res.json({
      success: true,
      data: result.data,
      requestId: req.id
    });
  } catch (error) {
    console.error(`Failed to get election: ${error.message}`);
    res.status(500).json({
      success: false,
      message: error.message,
      requestId: req.id
    });
  }
});

// Get election results
app.get('/api/elections/:electionId/results', async (req, res) => {
  try {
    const { electionId } = req.params;
    
    if (!electionId) {
      return res.status(400).json({
        success: false,
        message: 'Election ID is required',
        requestId: req.id
      });
    }
    
    // Get election results from blockchain
    const result = await blockchainService.getElectionResults(electionId);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
        requestId: req.id
      });
    }
    
    res.json({
      success: true,
      data: result.data,
      requestId: req.id
    });
  } catch (error) {
    console.error(`Failed to get election results: ${error.message}`);
    res.status(500).json({
      success: false,
      message: error.message,
      requestId: req.id
    });
  }
});

// Start an election
app.post('/api/elections/:electionId/start', async (req, res) => {
  try {
    const { electionId } = req.params;
    
    if (!electionId) {
      return res.status(400).json({
        success: false,
        message: 'Election ID is required',
        requestId: req.id
      });
    }
    
    // Start the election using blockchain service
    const result = await blockchainService.startElection(electionId);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
        requestId: req.id
      });
    }
    
    res.json({
      success: true,
      message: `Election ${electionId} started successfully`,
      data: result.data,
      requestId: req.id
    });
  } catch (error) {
    console.error(`Failed to start election: ${error.message}`);
    res.status(500).json({
      success: false,
      message: error.message,
      requestId: req.id
    });
  }
});

// End an election
app.post('/api/elections/:electionId/end', async (req, res) => {
  try {
    const { electionId } = req.params;
    
    if (!electionId) {
      return res.status(400).json({
        success: false,
        message: 'Election ID is required',
        requestId: req.id
      });
    }
    
    // End the election using blockchain service
    const result = await blockchainService.endElection(electionId);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
        requestId: req.id
      });
    }
    
    res.json({
      success: true,
      message: `Election ${electionId} ended successfully`,
      data: result.data,
      requestId: req.id
    });
  } catch (error) {
    console.error(`Failed to end election: ${error.message}`);
    res.status(500).json({
      success: false,
      message: error.message,
      requestId: req.id
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(`Error: ${err.message}`);
  // Return error response
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'An error occurred while processing your request' 
      : err.message,
    requestId: req.id
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Voter API server started on port ${PORT}`);
  
  // Initialize the blockchain service
  blockchainService.initialize()
    .then(result => {
      console.log('Blockchain service initialized successfully:', result.message);
    })
    .catch(error => {
      console.error(`Failed to initialize blockchain service: ${error.message}`);
    });
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

module.exports = app;
