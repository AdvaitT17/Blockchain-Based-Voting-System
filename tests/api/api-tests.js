/**
 * API Tests for Blockchain-Based Voting System
 * 
 * This script tests the functionality of all backend APIs to ensure they're working correctly.
 * It covers authentication, election management, candidate management, voter verification, and voting.
 */

const axios = require('axios');
const chai = require('chai');
const expect = chai.expect;
const config = require('../integration/test-config');

// Create axios instances for each API
const adminApi = axios.create({
  baseURL: config.apiEndpoints.adminApi,
});

const voterApi = axios.create({
  baseURL: config.apiEndpoints.voterApi,
});

const identityApi = axios.create({
  baseURL: config.apiEndpoints.identityApi,
});

// Test data
const { election, candidate, voter, pollingStation } = config.testData;
const { admin } = config.credentials;

describe('Blockchain-Based Voting System API Tests', function() {
  // Increase timeout for API operations
  this.timeout(10000);
  
  let adminToken;
  let electionId;
  let candidateId;
  let pollingStationId;
  
  before(async function() {
    try {
      console.log('Setting up test environment...');
    } catch (error) {
      console.error('Setup failed:', error.message);
      throw error;
    }
  });
  
  describe('Admin API Tests', function() {
    it('should authenticate admin user', async function() {
      try {
        const response = await adminApi.post('/auth/login', admin);
        
        expect(response.status).to.equal(200);
        expect(response.data.success).to.be.true;
        expect(response.data.data).to.have.property('token');
        
        adminToken = response.data.data.token;
        adminApi.defaults.headers.common['Authorization'] = `Bearer ${adminToken}`;
        
        console.log('Admin authenticated successfully');
      } catch (error) {
        console.error('Test failed:', error.message);
        throw error;
      }
    });
    
    it('should create a new election', async function() {
      try {
        const response = await adminApi.post('/elections', election);
        
        expect(response.status).to.equal(201);
        expect(response.data.success).to.be.true;
        expect(response.data.data).to.have.property('electionId');
        
        electionId = response.data.data.electionId;
        console.log(`Created election with ID: ${electionId}`);
      } catch (error) {
        console.error('Test failed:', error.message);
        throw error;
      }
    });
    
    it('should get all elections', async function() {
      try {
        const response = await adminApi.get('/elections');
        
        expect(response.status).to.equal(200);
        expect(response.data.success).to.be.true;
        expect(response.data.data).to.be.an('array');
        
        // Check if our created election is in the list
        const createdElection = response.data.data.find(e => e.electionId === electionId);
        expect(createdElection).to.exist;
        expect(createdElection.name).to.equal(election.name);
      } catch (error) {
        console.error('Test failed:', error.message);
        throw error;
      }
    });
    
    it('should get a specific election', async function() {
      try {
        const response = await adminApi.get(`/elections/${electionId}`);
        
        expect(response.status).to.equal(200);
        expect(response.data.success).to.be.true;
        expect(response.data.data).to.have.property('electionId', electionId);
        expect(response.data.data).to.have.property('name', election.name);
      } catch (error) {
        console.error('Test failed:', error.message);
        throw error;
      }
    });
    
    it('should update an election', async function() {
      try {
        const updatedElection = {
          ...election,
          name: 'Updated Test Election'
        };
        
        const response = await adminApi.put(`/elections/${electionId}`, updatedElection);
        
        expect(response.status).to.equal(200);
        expect(response.data.success).to.be.true;
        
        // Verify the update
        const getResponse = await adminApi.get(`/elections/${electionId}`);
        expect(getResponse.data.data.name).to.equal('Updated Test Election');
      } catch (error) {
        console.error('Test failed:', error.message);
        throw error;
      }
    });
    
    it('should add a candidate', async function() {
      try {
        const candidateData = {
          ...candidate,
          electionId: electionId
        };
        
        const response = await adminApi.post('/candidates', candidateData);
        
        expect(response.status).to.equal(201);
        expect(response.data.success).to.be.true;
        expect(response.data.data).to.have.property('candidateId');
        
        candidateId = response.data.data.candidateId;
        console.log(`Added candidate with ID: ${candidateId}`);
      } catch (error) {
        console.error('Test failed:', error.message);
        throw error;
      }
    });
    
    it('should get all candidates', async function() {
      try {
        const response = await adminApi.get('/candidates');
        
        expect(response.status).to.equal(200);
        expect(response.data.success).to.be.true;
        expect(response.data.data).to.be.an('array');
        
        // Check if our created candidate is in the list
        const createdCandidate = response.data.data.find(c => c.candidateId === candidateId);
        expect(createdCandidate).to.exist;
        expect(createdCandidate.name).to.equal(candidate.name);
      } catch (error) {
        console.error('Test failed:', error.message);
        throw error;
      }
    });
    
    it('should add a polling station', async function() {
      try {
        const response = await adminApi.post('/polling-stations', pollingStation);
        
        expect(response.status).to.equal(201);
        expect(response.data.success).to.be.true;
        expect(response.data.data).to.have.property('stationId');
        
        pollingStationId = response.data.data.stationId;
        console.log(`Added polling station with ID: ${pollingStationId}`);
      } catch (error) {
        console.error('Test failed:', error.message);
        throw error;
      }
    });
    
    it('should activate an election', async function() {
      try {
        const response = await adminApi.put(`/elections/${electionId}/activate`, {});
        
        expect(response.status).to.equal(200);
        expect(response.data.success).to.be.true;
        
        // Verify the activation
        const getResponse = await adminApi.get(`/elections/${electionId}`);
        expect(getResponse.data.data.status).to.equal('ACTIVE');
      } catch (error) {
        console.error('Test failed:', error.message);
        throw error;
      }
    });
  });
  
  describe('Identity API Tests', function() {
    it('should register a voter', async function() {
      try {
        // Set admin token for identity API
        identityApi.defaults.headers.common['Authorization'] = `Bearer ${adminToken}`;
        
        const response = await identityApi.post('/voters/register', voter);
        
        expect(response.status).to.equal(201);
        expect(response.data.success).to.be.true;
        
        console.log(`Registered voter with ID: ${voter.voterId}`);
      } catch (error) {
        console.error('Test failed:', error.message);
        throw error;
      }
    });
    
    it('should get voter information', async function() {
      try {
        const response = await identityApi.get(`/voters/${voter.voterId}`);
        
        expect(response.status).to.equal(200);
        expect(response.data.success).to.be.true;
        expect(response.data.data).to.have.property('voterId', voter.voterId);
        expect(response.data.data).to.have.property('constituencyId', voter.constituencyId);
      } catch (error) {
        console.error('Test failed:', error.message);
        throw error;
      }
    });
  });
  
  describe('Voter API Tests', function() {
    it('should verify a voter', async function() {
      try {
        const response = await voterApi.post('/voters/verify', {
          voterId: voter.voterId,
          aadharNumber: voter.aadharNumber
        });
        
        expect(response.status).to.equal(200);
        expect(response.data.success).to.be.true;
        expect(response.data.data.valid).to.be.true;
        expect(response.data.data.voter).to.have.property('voterId', voter.voterId);
      } catch (error) {
        console.error('Test failed:', error.message);
        throw error;
      }
    });
    
    it('should get active elections', async function() {
      try {
        const response = await voterApi.get('/elections/active');
        
        expect(response.status).to.equal(200);
        expect(response.data.success).to.be.true;
        expect(response.data.data).to.be.an('array');
        
        // Check if our activated election is in the list
        const activeElection = response.data.data.find(e => e.electionId === electionId);
        expect(activeElection).to.exist;
        expect(activeElection.status).to.equal('ACTIVE');
      } catch (error) {
        console.error('Test failed:', error.message);
        throw error;
      }
    });
    
    it('should get candidates for an election', async function() {
      try {
        const response = await voterApi.get(`/candidates/election/${electionId}`);
        
        expect(response.status).to.equal(200);
        expect(response.data.success).to.be.true;
        expect(response.data.data).to.be.an('array');
        
        // Check if our candidate is in the list
        const electionCandidate = response.data.data.find(c => c.candidateId === candidateId);
        expect(electionCandidate).to.exist;
        expect(electionCandidate.name).to.equal(candidate.name);
      } catch (error) {
        console.error('Test failed:', error.message);
        throw error;
      }
    });
    
    it('should cast a vote', async function() {
      try {
        const voteData = {
          electionId: electionId,
          candidateId: candidateId,
          voterId: voter.voterId,
          pollingStationId: pollingStationId
        };
        
        const response = await voterApi.post('/voting/cast', voteData);
        
        expect(response.status).to.equal(201);
        expect(response.data.success).to.be.true;
        expect(response.data.data).to.have.property('transactionId');
        
        console.log(`Vote cast with transaction ID: ${response.data.data.transactionId}`);
      } catch (error) {
        console.error('Test failed:', error.message);
        throw error;
      }
    });
    
    it('should check if voter has voted', async function() {
      try {
        const response = await voterApi.get(`/voters/${voter.voterId}/status`);
        
        expect(response.status).to.equal(200);
        expect(response.data.success).to.be.true;
        expect(response.data.data).to.have.property('hasVoted', true);
      } catch (error) {
        console.error('Test failed:', error.message);
        throw error;
      }
    });
    
    it('should prevent double voting', async function() {
      try {
        const voteData = {
          electionId: electionId,
          candidateId: candidateId,
          voterId: voter.voterId,
          pollingStationId: pollingStationId
        };
        
        try {
          await voterApi.post('/voting/cast', voteData);
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
  
  describe('Admin Results Tests', function() {
    it('should end an election', async function() {
      try {
        const response = await adminApi.put(`/elections/${electionId}/end`, {});
        
        expect(response.status).to.equal(200);
        expect(response.data.success).to.be.true;
        
        // Verify the election ended
        const getResponse = await adminApi.get(`/elections/${electionId}`);
        expect(getResponse.data.data.status).to.equal('ENDED');
      } catch (error) {
        console.error('Test failed:', error.message);
        throw error;
      }
    });
    
    it('should get election results', async function() {
      try {
        const response = await adminApi.get(`/elections/${electionId}/results`);
        
        expect(response.status).to.equal(200);
        expect(response.data.success).to.be.true;
        expect(response.data.data).to.have.property('results');
        expect(response.data.data.results).to.be.an('array');
        
        const candidateResult = response.data.data.results.find(r => r.candidateId === candidateId);
        expect(candidateResult).to.exist;
        expect(candidateResult.voteCount).to.be.at.least(1);
        
        console.log('Election results retrieved successfully');
      } catch (error) {
        console.error('Test failed:', error.message);
        throw error;
      }
    });
  });
  
  describe('Cleanup Tests', function() {
    it('should delete test data if cleanup is enabled', async function() {
      // Skip cleanup in most environments to preserve test data for inspection
      if (process.env.TEST_CLEANUP !== 'true') {
        this.skip();
      }
      
      try {
        // Delete candidate
        await adminApi.delete(`/candidates/${candidateId}`);
        
        // Delete election
        await adminApi.delete(`/elections/${electionId}`);
        
        // Delete polling station
        await adminApi.delete(`/polling-stations/${pollingStationId}`);
        
        console.log('Test data cleanup completed');
      } catch (error) {
        console.error('Cleanup failed:', error.message);
        throw error;
      }
    });
  });
  
  after(function() {
    console.log('API tests completed');
  });
});
