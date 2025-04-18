/**
 * Integration Tests for Blockchain-Based Voting System
 * 
 * These tests verify the integration between the backend APIs and the Hyperledger Fabric blockchain network.
 * They ensure that transactions are properly submitted to the blockchain and that the state is correctly updated.
 */

const axios = require('axios');
const chai = require('chai');
const expect = chai.expect;
const fabricConnection = require('../../backend/utils/fabric-connection');

// Test configuration
const config = {
  adminApi: process.env.ADMIN_API_URL || 'http://localhost:3001/api',
  voterApi: process.env.VOTER_API_URL || 'http://localhost:3003/api',
  identityApi: process.env.IDENTITY_API_URL || 'http://localhost:3002/api',
};

// Test data
const testElection = {
  name: 'Test Election',
  startTime: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
  endTime: new Date(Date.now() + 7200000).toISOString(),   // 2 hours from now
  constituencies: ['C001', 'C002'],
};

const testCandidate = {
  name: 'Test Candidate',
  party: 'Test Party',
  constituencyId: 'C001',
  constituencyName: 'Test Constituency',
  aadharNumber: '123456789012',
  voterId: 'ABC1234567',
};

const testVoter = {
  voterId: 'XYZ1234567',
  aadharNumber: '987654321098',
  constituencyId: 'C001',
};

const testPollingStation = {
  name: 'Test Polling Station',
  location: 'Test Location',
  constituencyId: 'C001',
  constituencyName: 'Test Constituency',
};

// Admin credentials
const adminCredentials = {
  username: 'admin',
  password: 'adminpassword',
};

describe('Blockchain-Based Voting System Integration Tests', function() {
  // Increase timeout for blockchain operations
  this.timeout(30000);
  
  let adminToken;
  let electionId;
  let candidateId;
  let pollingStationId;
  
  before(async function() {
    try {
      // Login as admin
      const loginResponse = await axios.post(`${config.adminApi}/auth/login`, adminCredentials);
      adminToken = loginResponse.data.data.token;
      expect(adminToken).to.be.a('string');
      
      // Initialize Fabric connection
      await fabricConnection.init();
      console.log('Fabric connection initialized');
    } catch (error) {
      console.error('Setup failed:', error.message);
      throw error;
    }
  });
  
  describe('Election Management', function() {
    it('should create a new election on the blockchain', async function() {
      try {
        const response = await axios.post(
          `${config.adminApi}/elections`,
          testElection,
          { headers: { Authorization: `Bearer ${adminToken}` } }
        );
        
        expect(response.status).to.equal(201);
        expect(response.data.success).to.be.true;
        expect(response.data.data).to.have.property('electionId');
        
        electionId = response.data.data.electionId;
        console.log(`Created election with ID: ${electionId}`);
        
        // Verify election was created on blockchain
        const fabricResponse = await fabricConnection.query(
          'votingChaincode',
          'getElection',
          [electionId]
        );
        
        const blockchainElection = JSON.parse(fabricResponse);
        expect(blockchainElection).to.have.property('electionId', electionId);
        expect(blockchainElection).to.have.property('name', testElection.name);
      } catch (error) {
        console.error('Test failed:', error.message);
        throw error;
      }
    });
    
    it('should add a candidate to the election on the blockchain', async function() {
      try {
        const candidateData = {
          ...testCandidate,
          electionId: electionId
        };
        
        const response = await axios.post(
          `${config.adminApi}/candidates`,
          candidateData,
          { headers: { Authorization: `Bearer ${adminToken}` } }
        );
        
        expect(response.status).to.equal(201);
        expect(response.data.success).to.be.true;
        expect(response.data.data).to.have.property('candidateId');
        
        candidateId = response.data.data.candidateId;
        console.log(`Added candidate with ID: ${candidateId}`);
        
        // Verify candidate was added on blockchain
        const fabricResponse = await fabricConnection.query(
          'votingChaincode',
          'getCandidate',
          [candidateId]
        );
        
        const blockchainCandidate = JSON.parse(fabricResponse);
        expect(blockchainCandidate).to.have.property('candidateId', candidateId);
        expect(blockchainCandidate).to.have.property('name', testCandidate.name);
      } catch (error) {
        console.error('Test failed:', error.message);
        throw error;
      }
    });
    
    it('should add a polling station on the blockchain', async function() {
      try {
        const response = await axios.post(
          `${config.adminApi}/polling-stations`,
          testPollingStation,
          { headers: { Authorization: `Bearer ${adminToken}` } }
        );
        
        expect(response.status).to.equal(201);
        expect(response.data.success).to.be.true;
        expect(response.data.data).to.have.property('stationId');
        
        pollingStationId = response.data.data.stationId;
        console.log(`Added polling station with ID: ${pollingStationId}`);
        
        // Verify polling station was added on blockchain
        const fabricResponse = await fabricConnection.query(
          'votingChaincode',
          'getPollingStation',
          [pollingStationId]
        );
        
        const blockchainStation = JSON.parse(fabricResponse);
        expect(blockchainStation).to.have.property('stationId', pollingStationId);
        expect(blockchainStation).to.have.property('name', testPollingStation.name);
      } catch (error) {
        console.error('Test failed:', error.message);
        throw error;
      }
    });
  });
  
  describe('Voter Registration and Verification', function() {
    it('should register a voter on the blockchain', async function() {
      try {
        const response = await axios.post(
          `${config.identityApi}/voters/register`,
          testVoter,
          { headers: { Authorization: `Bearer ${adminToken}` } }
        );
        
        expect(response.status).to.equal(201);
        expect(response.data.success).to.be.true;
        
        // Verify voter was registered on blockchain
        const fabricResponse = await fabricConnection.query(
          'identityChaincode',
          'getVoter',
          [testVoter.voterId]
        );
        
        const blockchainVoter = JSON.parse(fabricResponse);
        expect(blockchainVoter).to.have.property('voterId', testVoter.voterId);
        expect(blockchainVoter).to.have.property('constituencyId', testVoter.constituencyId);
      } catch (error) {
        console.error('Test failed:', error.message);
        throw error;
      }
    });
    
    it('should verify a voter successfully', async function() {
      try {
        const response = await axios.post(
          `${config.voterApi}/voters/verify`,
          {
            voterId: testVoter.voterId,
            aadharNumber: testVoter.aadharNumber
          }
        );
        
        expect(response.status).to.equal(200);
        expect(response.data.success).to.be.true;
        expect(response.data.data.valid).to.be.true;
      } catch (error) {
        console.error('Test failed:', error.message);
        throw error;
      }
    });
  });
  
  describe('Voting Process', function() {
    it('should cast a vote and record it on the blockchain', async function() {
      try {
        // First, activate the election
        await axios.put(
          `${config.adminApi}/elections/${electionId}/activate`,
          {},
          { headers: { Authorization: `Bearer ${adminToken}` } }
        );
        
        // Cast a vote
        const voteData = {
          electionId: electionId,
          candidateId: candidateId,
          voterId: testVoter.voterId,
          pollingStationId: pollingStationId
        };
        
        const response = await axios.post(
          `${config.voterApi}/voting/cast`,
          voteData
        );
        
        expect(response.status).to.equal(201);
        expect(response.data.success).to.be.true;
        expect(response.data.data).to.have.property('transactionId');
        
        // Verify vote was recorded on blockchain
        const fabricResponse = await fabricConnection.query(
          'votingChaincode',
          'hasVoted',
          [electionId, testVoter.voterId]
        );
        
        expect(fabricResponse).to.equal('true');
        
        // Get vote count for candidate
        const countResponse = await fabricConnection.query(
          'votingChaincode',
          'getCandidateVoteCount',
          [electionId, candidateId]
        );
        
        expect(parseInt(countResponse)).to.be.at.least(1);
      } catch (error) {
        console.error('Test failed:', error.message);
        throw error;
      }
    });
    
    it('should prevent double voting', async function() {
      try {
        // Try to cast another vote with the same voter
        const voteData = {
          electionId: electionId,
          candidateId: candidateId,
          voterId: testVoter.voterId,
          pollingStationId: pollingStationId
        };
        
        try {
          await axios.post(`${config.voterApi}/voting/cast`, voteData);
          // Should not reach here
          expect.fail('Should have thrown an error for double voting');
        } catch (error) {
          expect(error.response.status).to.equal(400);
          expect(error.response.data.success).to.be.false;
          expect(error.response.data.message).to.include('already voted');
        }
      } catch (error) {
        console.error('Test failed:', error.message);
        throw error;
      }
    });
  });
  
  describe('Election Results', function() {
    it('should retrieve election results from the blockchain', async function() {
      try {
        // End the election
        await axios.put(
          `${config.adminApi}/elections/${electionId}/end`,
          {},
          { headers: { Authorization: `Bearer ${adminToken}` } }
        );
        
        // Get election results
        const response = await axios.get(
          `${config.adminApi}/elections/${electionId}/results`,
          { headers: { Authorization: `Bearer ${adminToken}` } }
        );
        
        expect(response.status).to.equal(200);
        expect(response.data.success).to.be.true;
        expect(response.data.data).to.have.property('results');
        expect(response.data.data.results).to.be.an('array');
        
        const candidateResult = response.data.data.results.find(r => r.candidateId === candidateId);
        expect(candidateResult).to.exist;
        expect(candidateResult.voteCount).to.be.at.least(1);
      } catch (error) {
        console.error('Test failed:', error.message);
        throw error;
      }
    });
  });
  
  after(async function() {
    try {
      // Clean up test data (if your API supports it)
      // This is optional and depends on your implementation
      console.log('Test cleanup completed');
    } catch (error) {
      console.error('Cleanup failed:', error.message);
    }
  });
});
