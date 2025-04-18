/**
 * Identity API Server
 * Handles Aadhar and Voter ID verification
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
const PORT = process.env.IDENTITY_API_PORT || 3001;

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(bodyParser.json()); // Parse JSON bodies
app.use(morgan('dev')); // Request logging

// Initialize fabric connection
fabricConnection.initialize();

// Hash function for sensitive data
function hashData(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
}

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Identity API is running' });
});

// Aadhar verification endpoint
app.post('/api/verify/aadhar', async (req, res) => {
  const { aadharNumber, otp } = req.body;
  
  try {
    // In a real implementation, this would connect to the Aadhar verification service
    // For now, we'll simulate a successful verification
    if (aadharNumber && otp) {
      // Hash the Aadhar number for privacy
      const aadharHash = hashData(aadharNumber);
      
      // Log verification attempt
      console.log(`Aadhar verification attempt: ${aadharHash.substring(0, 10)}...`);
      
      res.json({
        success: true,
        message: 'Aadhar verification successful',
        data: {
          verified: true,
          aadharHash
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Aadhar number and OTP are required'
      });
    }
  } catch (error) {
    console.error(`Aadhar verification error: ${error}`);
    res.status(500).json({
      success: false,
      message: 'Internal server error during Aadhar verification'
    });
  }
});

// Voter ID verification endpoint
app.post('/api/verify/voter-id', async (req, res) => {
  const { voterIdNumber, dateOfBirth } = req.body;
  
  try {
    // In a real implementation, this would connect to the Voter ID verification service
    // For now, we'll simulate a successful verification
    if (voterIdNumber && dateOfBirth) {
      // Hash the Voter ID for privacy
      const voterIdHash = hashData(voterIdNumber);
      
      // Log verification attempt
      console.log(`Voter ID verification attempt: ${voterIdHash.substring(0, 10)}...`);
      
      // Determine constituency based on Voter ID (mock implementation)
      const constituencyId = `constituency${parseInt(voterIdNumber.substring(0, 2)) % 5 + 1}`;
      
      res.json({
        success: true,
        message: 'Voter ID verification successful',
        data: {
          verified: true,
          voterIdHash,
          constituencyId
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Voter ID number and date of birth are required'
      });
    }
  } catch (error) {
    console.error(`Voter ID verification error: ${error}`);
    res.status(500).json({
      success: false,
      message: 'Internal server error during Voter ID verification'
    });
  }
});

// Biometric verification endpoint
app.post('/api/verify/biometric', async (req, res) => {
  const { biometricData, aadharHash } = req.body;
  
  try {
    // In a real implementation, this would connect to the biometric verification service
    // For now, we'll simulate a successful verification
    if (biometricData && aadharHash) {
      // Log verification attempt
      console.log(`Biometric verification attempt for Aadhar: ${aadharHash.substring(0, 10)}...`);
      
      res.json({
        success: true,
        message: 'Biometric verification successful',
        data: {
          verified: true,
          verificationTimestamp: new Date().toISOString()
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Biometric data and Aadhar hash are required'
      });
    }
  } catch (error) {
    console.error(`Biometric verification error: ${error}`);
    res.status(500).json({
      success: false,
      message: 'Internal server error during biometric verification'
    });
  }
});

// Zero-knowledge proof generation endpoint
app.post('/api/generate/zkp', async (req, res) => {
  const { voterIdHash, electionId } = req.body;
  
  try {
    // In a real implementation, this would generate a cryptographic zero-knowledge proof
    // For now, we'll simulate a successful generation
    if (voterIdHash && electionId) {
      // Connect to the blockchain network
      const { gateway, network, error } = await fabricConnection.connectToNetwork('StateElectionOffice', 'identity-api-user');
      
      if (error) {
        console.error(`Error connecting to the network: ${error}`);
        return res.status(500).json({
          success: false,
          message: 'Failed to connect to the blockchain network'
        });
      }
      
      // Get the identity contract
      const { contract, error: contractError } = fabricConnection.getContract(network, 'identity');
      
      if (contractError) {
        console.error(`Error getting contract: ${contractError}`);
        gateway.disconnect();
        return res.status(500).json({
          success: false,
          message: 'Failed to get the identity contract'
        });
      }
      
      // Verify voter eligibility on the blockchain
      try {
        await contract.submitTransaction('verifyVoter', voterIdHash, electionId);
        
        // Generate a ZKP token (simplified for demo)
        const timestamp = Date.now();
        const randomValue = Math.floor(Math.random() * 1000000);
        const zkProof = hashData(`${voterIdHash}_${electionId}_${timestamp}_${randomValue}`);
        
        // Disconnect from the gateway
        gateway.disconnect();
        
        res.json({
          success: true,
          message: 'Zero-knowledge proof generated successfully',
          data: {
            zkProof,
            timestamp: new Date(timestamp).toISOString(),
            electionId,
            expiresAt: new Date(timestamp + 3600000).toISOString() // Expires in 1 hour
          }
        });
      } catch (txError) {
        console.error(`Transaction error: ${txError}`);
        gateway.disconnect();
        
        // Check if the error is because the voter has already voted
        if (txError.message.includes('has already voted')) {
          return res.status(400).json({
            success: false,
            message: 'Voter has already voted in this election'
          });
        }
        
        // Check if the error is because the voter is not eligible
        if (txError.message.includes('is not eligible')) {
          return res.status(400).json({
            success: false,
            message: 'Voter is not eligible to vote in this election'
          });
        }
        
        return res.status(500).json({
          success: false,
          message: 'Error processing transaction on the blockchain'
        });
      }
    } else {
      res.status(400).json({
        success: false,
        message: 'Voter ID hash and election ID are required'
      });
    }
  } catch (error) {
    console.error(`ZKP generation error: ${error}`);
    res.status(500).json({
      success: false,
      message: 'Internal server error during ZKP generation'
    });
  }
});

// Register voter endpoint
app.post('/api/voters/register', async (req, res) => {
  const { voterIdHash, aadharHash, constituencyId } = req.body;
  
  try {
    if (!voterIdHash || !aadharHash || !constituencyId) {
      return res.status(400).json({
        success: false,
        message: 'Voter ID hash, Aadhar hash, and constituency ID are required'
      });
    }
    
    // Connect to the blockchain network
    const { gateway, network, error } = await fabricConnection.connectToNetwork('StateElectionOffice', 'identity-api-user');
    
    if (error) {
      console.error(`Error connecting to the network: ${error}`);
      return res.status(500).json({
        success: false,
        message: 'Failed to connect to the blockchain network'
      });
    }
    
    // Get the identity contract
    const { contract, error: contractError } = fabricConnection.getContract(network, 'identity');
    
    if (contractError) {
      console.error(`Error getting contract: ${contractError}`);
      gateway.disconnect();
      return res.status(500).json({
        success: false,
        message: 'Failed to get the identity contract'
      });
    }
    
    // Register voter on the blockchain
    try {
      const result = await contract.submitTransaction('registerVoter', voterIdHash, aadharHash, constituencyId, 'true');
      const voter = JSON.parse(result.toString());
      
      // Disconnect from the gateway
      gateway.disconnect();
      
      res.json({
        success: true,
        message: 'Voter registered successfully',
        data: {
          voterIdHash: voter.voterIdHash,
          constituencyId: voter.constituencyId,
          registrationTime: new Date().toISOString(),
          status: 'REGISTERED'
        }
      });
    } catch (txError) {
      console.error(`Transaction error: ${txError}`);
      gateway.disconnect();
      
      // Check if the error is because the voter already exists
      if (txError.message.includes('already exists')) {
        return res.status(400).json({
          success: false,
          message: 'Voter is already registered'
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Error registering voter on the blockchain'
      });
    }
  } catch (error) {
    console.error(`Voter registration error: ${error}`);
    res.status(500).json({
      success: false,
      message: 'Internal server error during voter registration'
    });
  }
});

// Get voter status endpoint
app.get('/api/voters/:voterIdHash/status', async (req, res) => {
  const { voterIdHash } = req.params;
  const { electionId } = req.query;
  
  try {
    if (!voterIdHash || !electionId) {
      return res.status(400).json({
        success: false,
        message: 'Voter ID hash and election ID are required'
      });
    }
    
    // Connect to the blockchain network
    const { gateway, network, error } = await fabricConnection.connectToNetwork('StateElectionOffice', 'identity-api-user');
    
    if (error) {
      console.error(`Error connecting to the network: ${error}`);
      return res.status(500).json({
        success: false,
        message: 'Failed to connect to the blockchain network'
      });
    }
    
    // Get the identity contract
    const { contract, error: contractError } = fabricConnection.getContract(network, 'identity');
    
    if (contractError) {
      console.error(`Error getting contract: ${contractError}`);
      gateway.disconnect();
      return res.status(500).json({
        success: false,
        message: 'Failed to get the identity contract'
      });
    }
    
    // Get voter status from the blockchain
    try {
      const result = await contract.evaluateTransaction('getVoterStatus', voterIdHash, electionId);
      const voterStatus = JSON.parse(result.toString());
      
      // Disconnect from the gateway
      gateway.disconnect();
      
      res.json({
        success: true,
        message: 'Voter status retrieved successfully',
        data: voterStatus
      });
    } catch (txError) {
      console.error(`Transaction error: ${txError}`);
      gateway.disconnect();
      
      // Check if the error is because the voter does not exist
      if (txError.message.includes('does not exist')) {
        return res.status(404).json({
          success: false,
          message: 'Voter not found'
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Error retrieving voter status from the blockchain'
      });
    }
  } catch (error) {
    console.error(`Get voter status error: ${error}`);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving voter status'
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
  console.log(`Identity API server running on port ${PORT}`);
});
