/**
 * Admin API Server
 * Handles election management, candidate registration, and result tabulation
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const helmet = require('helmet');
const dotenv = require('dotenv');
const crypto = require('crypto');
const path = require('path');
const fabricConnection = require('../utils/fabric-connection');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.ADMIN_API_PORT || 3002;

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(bodyParser.json()); // Parse JSON bodies
app.use(morgan('dev')); // Request logging

// Initialize fabric connection
fabricConnection.initialize();

// Generate unique IDs
function generateId(prefix) {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Admin API is running' });
});

// Create election endpoint
app.post('/api/elections', async (req, res) => {
  const { name, startTime, endTime, constituencies } = req.body;
  
  try {
    // Validate input
    if (!name || !startTime || !endTime || !constituencies || !Array.isArray(constituencies)) {
      return res.status(400).json({
        success: false,
        message: 'Name, start time, end time, and constituencies array are required'
      });
    }
    
    // Connect to the blockchain network
    const { gateway, network, error } = await fabricConnection.connectToNetwork('StateElectionOffice', 'admin-api-user');
    
    if (error) {
      console.error(`Error connecting to the network: ${error}`);
      return res.status(500).json({
        success: false,
        message: 'Failed to connect to the blockchain network'
      });
    }
    
    // Get the voting contract
    const { contract, error: contractError } = fabricConnection.getContract(network, 'voting');
    
    if (contractError) {
      console.error(`Error getting contract: ${contractError}`);
      gateway.disconnect();
      return res.status(500).json({
        success: false,
        message: 'Failed to get the voting contract'
      });
    }
    
    // Generate election ID
    const electionId = generateId('election');
    
    // Create election on the blockchain
    try {
      const result = await contract.submitTransaction(
        'createElection', 
        electionId, 
        name, 
        startTime, 
        endTime, 
        JSON.stringify(constituencies)
      );
      
      const election = JSON.parse(result.toString());
      
      // Disconnect from the gateway
      gateway.disconnect();
      
      res.json({
        success: true,
        message: 'Election created successfully',
        data: election
      });
    } catch (txError) {
      console.error(`Transaction error: ${txError}`);
      gateway.disconnect();
      
      return res.status(500).json({
        success: false,
        message: 'Error creating election on the blockchain'
      });
    }
  } catch (error) {
    console.error(`Create election error: ${error}`);
    res.status(500).json({
      success: false,
      message: 'Internal server error during election creation'
    });
  }
});

// Register candidate endpoint
app.post('/api/candidates', async (req, res) => {
  const { name, partyId, constituencyId, electionId } = req.body;
  
  try {
    // Validate input
    if (!name || !partyId || !constituencyId || !electionId) {
      return res.status(400).json({
        success: false,
        message: 'Name, party ID, constituency ID, and election ID are required'
      });
    }
    
    // Connect to the blockchain network
    const { gateway, network, error } = await fabricConnection.connectToNetwork('StateElectionOffice', 'admin-api-user');
    
    if (error) {
      console.error(`Error connecting to the network: ${error}`);
      return res.status(500).json({
        success: false,
        message: 'Failed to connect to the blockchain network'
      });
    }
    
    // Get the voting contract
    const { contract, error: contractError } = fabricConnection.getContract(network, 'voting');
    
    if (contractError) {
      console.error(`Error getting contract: ${contractError}`);
      gateway.disconnect();
      return res.status(500).json({
        success: false,
        message: 'Failed to get the voting contract'
      });
    }
    
    // Generate candidate ID
    const candidateId = generateId('candidate');
    
    // Register candidate on the blockchain
    try {
      const result = await contract.submitTransaction(
        'registerCandidate', 
        candidateId, 
        electionId, 
        constituencyId, 
        partyId, 
        name
      );
      
      const candidate = JSON.parse(result.toString());
      
      // Disconnect from the gateway
      gateway.disconnect();
      
      res.json({
        success: true,
        message: 'Candidate registered successfully',
        data: candidate
      });
    } catch (txError) {
      console.error(`Transaction error: ${txError}`);
      gateway.disconnect();
      
      return res.status(500).json({
        success: false,
        message: 'Error registering candidate on the blockchain'
      });
    }
  } catch (error) {
    console.error(`Register candidate error: ${error}`);
    res.status(500).json({
      success: false,
      message: 'Internal server error during candidate registration'
    });
  }
});

// Register polling station endpoint
app.post('/api/polling-stations', async (req, res) => {
  const { name, location, constituencyId } = req.body;
  
  try {
    // Validate input
    if (!name || !location || !constituencyId) {
      return res.status(400).json({
        success: false,
        message: 'Name, location, and constituency ID are required'
      });
    }
    
    // Connect to the blockchain network
    const { gateway, network, error } = await fabricConnection.connectToNetwork('StateElectionOffice', 'admin-api-user');
    
    if (error) {
      console.error(`Error connecting to the network: ${error}`);
      return res.status(500).json({
        success: false,
        message: 'Failed to connect to the blockchain network'
      });
    }
    
    // Get the voting contract
    const { contract, error: contractError } = fabricConnection.getContract(network, 'voting');
    
    if (contractError) {
      console.error(`Error getting contract: ${contractError}`);
      gateway.disconnect();
      return res.status(500).json({
        success: false,
        message: 'Failed to get the voting contract'
      });
    }
    
    // Generate station ID
    const stationId = generateId('station');
    
    // Register polling station on the blockchain
    try {
      const result = await contract.submitTransaction(
        'registerPollingStation', 
        stationId, 
        constituencyId, 
        location
      );
      
      const station = JSON.parse(result.toString());
      
      // Disconnect from the gateway
      gateway.disconnect();
      
      res.json({
        success: true,
        message: 'Polling station registered successfully',
        data: station
      });
    } catch (txError) {
      console.error(`Transaction error: ${txError}`);
      gateway.disconnect();
      
      return res.status(500).json({
        success: false,
        message: 'Error registering polling station on the blockchain'
      });
    }
  } catch (error) {
    console.error(`Register polling station error: ${error}`);
    res.status(500).json({
      success: false,
      message: 'Internal server error during polling station registration'
    });
  }
});

// Get election results endpoint
app.get('/api/elections/:electionId/results', async (req, res) => {
  const { electionId } = req.params;
  
  try {
    if (!electionId) {
      return res.status(400).json({
        success: false,
        message: 'Election ID is required'
      });
    }
    
    // Connect to the blockchain network
    const { gateway, network, error } = await fabricConnection.connectToNetwork('StateElectionOffice', 'admin-api-user');
    
    if (error) {
      console.error(`Error connecting to the network: ${error}`);
      return res.status(500).json({
        success: false,
        message: 'Failed to connect to the blockchain network'
      });
    }
    
    // Get the voting contract
    const { contract, error: contractError } = fabricConnection.getContract(network, 'voting');
    
    if (contractError) {
      console.error(`Error getting contract: ${contractError}`);
      gateway.disconnect();
      return res.status(500).json({
        success: false,
        message: 'Failed to get the voting contract'
      });
    }
    
    // Get election results from the blockchain
    try {
      const result = await contract.evaluateTransaction('getElectionResults', electionId);
      const results = JSON.parse(result.toString());
      
      // Get election details
      const electionResult = await contract.evaluateTransaction('getElection', electionId);
      const election = JSON.parse(electionResult.toString());
      
      // Process results by constituency
      const resultsByConstituency = {};
      
      // Initialize constituencies from election data
      election.constituencies.forEach(constituencyId => {
        resultsByConstituency[constituencyId] = {
          constituencyId,
          name: `Constituency ${constituencyId.replace('constituency', '')}`,
          candidates: []
        };
      });
      
      // Get candidates for this election
      const candidatesResult = await contract.evaluateTransaction('getCandidatesByElection', electionId);
      const candidates = JSON.parse(candidatesResult.toString());
      
      // Organize candidates by constituency
      candidates.forEach(candidate => {
        if (resultsByConstituency[candidate.constituencyId]) {
          resultsByConstituency[candidate.constituencyId].candidates.push(candidate);
        }
      });
      
      // Disconnect from the gateway
      gateway.disconnect();
      
      res.json({
        success: true,
        message: 'Election results retrieved successfully',
        data: {
          electionId,
          name: election.name,
          startTime: election.startTime,
          endTime: election.endTime,
          status: election.status,
          constituencies: Object.values(resultsByConstituency)
        }
      });
    } catch (txError) {
      console.error(`Transaction error: ${txError}`);
      gateway.disconnect();
      
      // Check if the error is because the election does not exist
      if (txError.message.includes('does not exist')) {
        return res.status(404).json({
          success: false,
          message: 'Election not found'
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Error retrieving election results from the blockchain'
      });
    }
  } catch (error) {
    console.error(`Get election results error: ${error}`);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving election results'
    });
  }
});

// Start election endpoint
app.post('/api/elections/:electionId/start', async (req, res) => {
  const { electionId } = req.params;
  
  try {
    if (!electionId) {
      return res.status(400).json({
        success: false,
        message: 'Election ID is required'
      });
    }
    
    // Connect to the blockchain network
    const { gateway, network, error } = await fabricConnection.connectToNetwork('StateElectionOffice', 'admin-api-user');
    
    if (error) {
      console.error(`Error connecting to the network: ${error}`);
      return res.status(500).json({
        success: false,
        message: 'Failed to connect to the blockchain network'
      });
    }
    
    // Get the voting contract
    const { contract, error: contractError } = fabricConnection.getContract(network, 'voting');
    
    if (contractError) {
      console.error(`Error getting contract: ${contractError}`);
      gateway.disconnect();
      return res.status(500).json({
        success: false,
        message: 'Failed to get the voting contract'
      });
    }
    
    // Start election on the blockchain
    try {
      const result = await contract.submitTransaction('startElection', electionId);
      const election = JSON.parse(result.toString());
      
      // Disconnect from the gateway
      gateway.disconnect();
      
      res.json({
        success: true,
        message: 'Election started successfully',
        data: election
      });
    } catch (txError) {
      console.error(`Transaction error: ${txError}`);
      gateway.disconnect();
      
      // Check if the error is because the election does not exist
      if (txError.message.includes('does not exist')) {
        return res.status(404).json({
          success: false,
          message: 'Election not found'
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Error starting election on the blockchain'
      });
    }
  } catch (error) {
    console.error(`Start election error: ${error}`);
    res.status(500).json({
      success: false,
      message: 'Internal server error while starting election'
    });
  }
});

// End election endpoint
app.post('/api/elections/:electionId/end', async (req, res) => {
  const { electionId } = req.params;
  
  try {
    if (!electionId) {
      return res.status(400).json({
        success: false,
        message: 'Election ID is required'
      });
    }
    
    // Connect to the blockchain network
    const { gateway, network, error } = await fabricConnection.connectToNetwork('StateElectionOffice', 'admin-api-user');
    
    if (error) {
      console.error(`Error connecting to the network: ${error}`);
      return res.status(500).json({
        success: false,
        message: 'Failed to connect to the blockchain network'
      });
    }
    
    // Get the voting contract
    const { contract, error: contractError } = fabricConnection.getContract(network, 'voting');
    
    if (contractError) {
      console.error(`Error getting contract: ${contractError}`);
      gateway.disconnect();
      return res.status(500).json({
        success: false,
        message: 'Failed to get the voting contract'
      });
    }
    
    // End election on the blockchain
    try {
      const result = await contract.submitTransaction('endElection', electionId);
      const election = JSON.parse(result.toString());
      
      // Disconnect from the gateway
      gateway.disconnect();
      
      res.json({
        success: true,
        message: 'Election ended successfully',
        data: election
      });
    } catch (txError) {
      console.error(`Transaction error: ${txError}`);
      gateway.disconnect();
      
      // Check if the error is because the election does not exist
      if (txError.message.includes('does not exist')) {
        return res.status(404).json({
          success: false,
          message: 'Election not found'
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Error ending election on the blockchain'
      });
    }
  } catch (error) {
    console.error(`End election error: ${error}`);
    res.status(500).json({
      success: false,
      message: 'Internal server error while ending election'
    });
  }
});

// Get all elections endpoint
app.get('/api/elections', async (req, res) => {
  try {
    // Connect to the blockchain network
    const { gateway, network, error } = await fabricConnection.connectToNetwork('StateElectionOffice', 'admin-api-user');
    
    if (error) {
      console.error(`Error connecting to the network: ${error}`);
      return res.status(500).json({
        success: false,
        message: 'Failed to connect to the blockchain network'
      });
    }
    
    // Get the voting contract
    const { contract, error: contractError } = fabricConnection.getContract(network, 'voting');
    
    if (contractError) {
      console.error(`Error getting contract: ${contractError}`);
      gateway.disconnect();
      return res.status(500).json({
        success: false,
        message: 'Failed to get the voting contract'
      });
    }
    
    // For now, we'll return a mock response since the chaincode doesn't have a getAllElections function
    // In a real implementation, we would query the blockchain for all elections
    
    // Disconnect from the gateway
    gateway.disconnect();
    
    // Mock data for demonstration
    const elections = [
      {
        electionId: 'election_1681234567_123',
        name: 'General Election 2023',
        startTime: '2023-05-01T08:00:00Z',
        endTime: '2023-05-01T18:00:00Z',
        status: 'UPCOMING',
        constituencies: ['constituency1', 'constituency2']
      },
      {
        electionId: 'election_1681234568_456',
        name: 'Local Elections 2023',
        startTime: '2023-06-15T08:00:00Z',
        endTime: '2023-06-15T18:00:00Z',
        status: 'UPCOMING',
        constituencies: ['constituency3', 'constituency4']
      }
    ];
    
    res.json({
      success: true,
      message: 'Elections retrieved successfully',
      data: elections
    });
  } catch (error) {
    console.error(`Get elections error: ${error}`);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving elections'
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Admin API server running on port ${PORT}`);
});
