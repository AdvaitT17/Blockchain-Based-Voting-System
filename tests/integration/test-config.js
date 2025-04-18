/**
 * Test Configuration for Blockchain-Based Voting System
 * 
 * This file contains configuration settings for running integration tests.
 */

module.exports = {
  // API endpoints
  apiEndpoints: {
    adminApi: process.env.ADMIN_API_URL || 'http://localhost:3001/api',
    voterApi: process.env.VOTER_API_URL || 'http://localhost:3003/api',
    identityApi: process.env.IDENTITY_API_URL || 'http://localhost:3002/api',
  },
  
  // Test credentials
  credentials: {
    admin: {
      username: process.env.TEST_ADMIN_USERNAME || 'admin',
      password: process.env.TEST_ADMIN_PASSWORD || 'adminpassword',
    },
    pollingStation: {
      stationId: process.env.TEST_STATION_ID || 'PS001',
      password: process.env.TEST_STATION_PASSWORD || 'stationpassword',
    }
  },
  
  // Blockchain configuration
  blockchain: {
    channelName: process.env.CHANNEL_NAME || 'votingchannel',
    chaincodeNames: {
      voting: process.env.VOTING_CHAINCODE_NAME || 'votingChaincode',
      identity: process.env.IDENTITY_CHAINCODE_NAME || 'identityChaincode',
    },
    orgMSP: process.env.ORG_MSP || 'ElectionCommissionMSP',
    peerEndpoint: process.env.PEER_ENDPOINT || 'localhost:7051',
  },
  
  // Test data
  testData: {
    election: {
      name: 'Test Election',
      startTime: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
      endTime: new Date(Date.now() + 7200000).toISOString(),   // 2 hours from now
      constituencies: ['C001', 'C002'],
    },
    candidate: {
      name: 'Test Candidate',
      party: 'Test Party',
      constituencyId: 'C001',
      constituencyName: 'Test Constituency',
      aadharNumber: '123456789012',
      voterId: 'ABC1234567',
    },
    voter: {
      voterId: 'XYZ1234567',
      aadharNumber: '987654321098',
      constituencyId: 'C001',
    },
    pollingStation: {
      name: 'Test Polling Station',
      location: 'Test Location',
      constituencyId: 'C001',
      constituencyName: 'Test Constituency',
    }
  }
};
