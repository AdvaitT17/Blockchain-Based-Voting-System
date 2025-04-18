'use strict';

/**
 * Real Blockchain Service using Hyperledger Fabric
 * Connects to a running Hyperledger Fabric network
 */

const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');
const fabricConnection = require('./fabric-connection');

// Initialize the fabric connection
async function initialize() {
    try {
        // Initialize the fabric connection utilities
        const result = await fabricConnection.initialize();
        if (!result.success) {
            throw new Error(result.error);
        }
        
        console.log('Fabric blockchain service initialized successfully');
        return { success: true, message: 'Fabric blockchain service initialized successfully' };
    } catch (error) {
        console.error(`Failed to initialize fabric blockchain service: ${error.message}`);
        return { error: error.message };
    }
}

// Test connection to the blockchain
async function testConnection() {
    try {
        // Connect to the network
        const { gateway, network, error } = await fabricConnection.connectToNetwork('Org1', 'admin');
        if (error) {
            throw new Error(error);
        }
        
        // Disconnect from the gateway
        gateway.disconnect();
        
        console.log('Successfully connected to blockchain network');
        return { success: true, message: 'Successfully connected to blockchain network' };
    } catch (error) {
        console.error(`Failed to connect to blockchain network: ${error.message}`);
        return { error: error.message };
    }
}

// Register a voter
async function registerVoter(voterId, name, aadharId, votingDistrict) {
    let gateway;
    try {
        console.log(`Registering voter ${voterId}`);
        
        // Connect to the network
        const connectionResult = await fabricConnection.connectToNetwork('Org1', 'admin');
        if (connectionResult.error) {
            throw new Error(connectionResult.error);
        }
        
        gateway = connectionResult.gateway;
        const network = connectionResult.network;
        
        // Get the contract
        const contractResult = fabricConnection.getContract(network, 'voting');
        if (contractResult.error) {
            throw new Error(contractResult.error);
        }
        
        const contract = contractResult.contract;
        
        // Submit the transaction
        const result = await contract.submitTransaction('registerVoter', voterId, name, aadharId, votingDistrict);
        const voter = JSON.parse(result.toString());
        
        console.log(`Voter ${voterId} registered successfully`);
        return { success: true, message: `Voter ${voterId} registered successfully`, data: voter };
    } catch (error) {
        console.error(`Failed to register voter: ${error.message}`);
        return { success: false, message: error.message };
    } finally {
        // Disconnect from the gateway
        if (gateway) {
            gateway.disconnect();
        }
    }
}

// Get voter by ID
async function getVoter(voterId) {
    let gateway;
    try {
        console.log(`Getting voter ${voterId}`);
        
        // Connect to the network
        const connectionResult = await fabricConnection.connectToNetwork('Org1', 'admin');
        if (connectionResult.error) {
            throw new Error(connectionResult.error);
        }
        
        gateway = connectionResult.gateway;
        const network = connectionResult.network;
        
        // Get the contract
        const contractResult = fabricConnection.getContract(network, 'voting');
        if (contractResult.error) {
            throw new Error(contractResult.error);
        }
        
        const contract = contractResult.contract;
        
        // Evaluate the transaction
        const result = await contract.evaluateTransaction('getVoter', voterId);
        const voter = JSON.parse(result.toString());
        
        return { success: true, data: voter };
    } catch (error) {
        console.error(`Failed to get voter: ${error.message}`);
        return { success: false, message: error.message };
    } finally {
        // Disconnect from the gateway
        if (gateway) {
            gateway.disconnect();
        }
    }
}

// Cast a vote
async function castVote(voterId, electionId, candidateId) {
    let gateway;
    try {
        console.log(`Casting vote for election ${electionId} by voter ${voterId} for candidate ${candidateId}`);
        
        // Connect to the network
        const connectionResult = await fabricConnection.connectToNetwork('Org1', 'admin');
        if (connectionResult.error) {
            throw new Error(connectionResult.error);
        }
        
        gateway = connectionResult.gateway;
        const network = connectionResult.network;
        
        // Get the contract
        const contractResult = fabricConnection.getContract(network, 'voting');
        if (contractResult.error) {
            throw new Error(contractResult.error);
        }
        
        const contract = contractResult.contract;
        
        // Submit the transaction
        const result = await contract.submitTransaction('castVote', voterId, electionId, candidateId);
        const vote = JSON.parse(result.toString());
        
        console.log(`Vote cast successfully`);
        return { success: true, message: `Vote cast successfully`, data: vote };
    } catch (error) {
        console.error(`Failed to cast vote: ${error.message}`);
        return { success: false, message: error.message };
    } finally {
        // Disconnect from the gateway
        if (gateway) {
            gateway.disconnect();
        }
    }
}

// Get election by ID
async function getElection(electionId) {
    let gateway;
    try {
        console.log(`Getting election ${electionId}`);
        
        // Connect to the network
        const connectionResult = await fabricConnection.connectToNetwork('Org1', 'admin');
        if (connectionResult.error) {
            throw new Error(connectionResult.error);
        }
        
        gateway = connectionResult.gateway;
        const network = connectionResult.network;
        
        // Get the contract
        const contractResult = fabricConnection.getContract(network, 'voting');
        if (contractResult.error) {
            throw new Error(contractResult.error);
        }
        
        const contract = contractResult.contract;
        
        // Evaluate the transaction
        const result = await contract.evaluateTransaction('getElection', electionId);
        const election = JSON.parse(result.toString());
        
        return { success: true, data: election };
    } catch (error) {
        console.error(`Failed to get election: ${error.message}`);
        return { success: false, message: error.message };
    } finally {
        // Disconnect from the gateway
        if (gateway) {
            gateway.disconnect();
        }
    }
}

// Get all elections
async function getAllElections() {
    let gateway;
    try {
        console.log('Getting all elections');
        
        // Connect to the network
        const connectionResult = await fabricConnection.connectToNetwork('Org1', 'admin');
        if (connectionResult.error) {
            throw new Error(connectionResult.error);
        }
        
        gateway = connectionResult.gateway;
        const network = connectionResult.network;
        
        // Get the contract
        const contractResult = fabricConnection.getContract(network, 'voting');
        if (contractResult.error) {
            throw new Error(contractResult.error);
        }
        
        const contract = contractResult.contract;
        
        // Evaluate the transaction
        const result = await contract.evaluateTransaction('getAllElections');
        const elections = JSON.parse(result.toString());
        
        // Process the elections to match the expected format
        const processedElections = elections.map(item => item.Record);
        
        return { success: true, data: processedElections };
    } catch (error) {
        console.error(`Failed to get all elections: ${error.message}`);
        return { success: false, message: error.message };
    } finally {
        // Disconnect from the gateway
        if (gateway) {
            gateway.disconnect();
        }
    }
}

// Create a new election
async function createElection(electionId, name, startDate, endDate, constituencies) {
    let gateway;
    try {
        console.log(`Creating election ${electionId}`);
        
        // Connect to the network
        const connectionResult = await fabricConnection.connectToNetwork('Org1', 'admin');
        if (connectionResult.error) {
            throw new Error(connectionResult.error);
        }
        
        gateway = connectionResult.gateway;
        const network = connectionResult.network;
        
        // Get the contract
        const contractResult = fabricConnection.getContract(network, 'voting');
        if (contractResult.error) {
            throw new Error(contractResult.error);
        }
        
        const contract = contractResult.contract;
        
        // Submit the transaction
        const result = await contract.submitTransaction('createElection', electionId, name, startDate, endDate, JSON.stringify(constituencies));
        const election = JSON.parse(result.toString());
        
        console.log(`Election ${electionId} created successfully`);
        return { success: true, message: `Election ${electionId} created successfully`, data: election };
    } catch (error) {
        console.error(`Failed to create election: ${error.message}`);
        return { success: false, message: error.message };
    } finally {
        // Disconnect from the gateway
        if (gateway) {
            gateway.disconnect();
        }
    }
}

// Add a candidate to an election
async function addCandidate(electionId, candidateId, name, party, constituencyId) {
    let gateway;
    try {
        console.log(`Adding candidate ${candidateId} to election ${electionId}`);
        
        // Connect to the network
        const connectionResult = await fabricConnection.connectToNetwork('Org1', 'admin');
        if (connectionResult.error) {
            throw new Error(connectionResult.error);
        }
        
        gateway = connectionResult.gateway;
        const network = connectionResult.network;
        
        // Get the contract
        const contractResult = fabricConnection.getContract(network, 'voting');
        if (contractResult.error) {
            throw new Error(contractResult.error);
        }
        
        const contract = contractResult.contract;
        
        // Submit the transaction
        const result = await contract.submitTransaction('addCandidate', electionId, candidateId, name, party, constituencyId);
        const candidate = JSON.parse(result.toString());
        
        console.log(`Candidate ${candidateId} added to election ${electionId} successfully`);
        return { success: true, message: `Candidate ${candidateId} added to election ${electionId} successfully`, data: candidate };
    } catch (error) {
        console.error(`Failed to add candidate: ${error.message}`);
        return { success: false, message: error.message };
    } finally {
        // Disconnect from the gateway
        if (gateway) {
            gateway.disconnect();
        }
    }
}

// Start an election
async function startElection(electionId) {
    let gateway;
    try {
        console.log(`Starting election ${electionId}`);
        
        // Get the election first to check its status
        const electionResult = await getElection(electionId);
        if (!electionResult.success) {
            throw new Error(electionResult.message);
        }
        
        const election = electionResult.data;
        
        // Check if election is in upcoming status
        if (election.status !== 'UPCOMING') {
            return { success: false, message: `Cannot start election with status ${election.status}` };
        }
        
        // Connect to the network
        const connectionResult = await fabricConnection.connectToNetwork('Org1', 'admin');
        if (connectionResult.error) {
            throw new Error(connectionResult.error);
        }
        
        gateway = connectionResult.gateway;
        const network = connectionResult.network;
        
        // Get the contract
        const contractResult = fabricConnection.getContract(network, 'voting');
        if (contractResult.error) {
            throw new Error(contractResult.error);
        }
        
        const contract = contractResult.contract;
        
        // Update election status
        election.status = 'ACTIVE';
        
        // Submit the transaction to update the election
        await contract.submitTransaction('updateElection', electionId, JSON.stringify(election));
        
        console.log(`Election ${electionId} started successfully`);
        return { success: true, message: `Election ${electionId} started successfully`, data: election };
    } catch (error) {
        console.error(`Failed to start election: ${error.message}`);
        return { success: false, message: error.message };
    } finally {
        // Disconnect from the gateway
        if (gateway) {
            gateway.disconnect();
        }
    }
}

// End an election
async function endElection(electionId) {
    let gateway;
    try {
        console.log(`Ending election ${electionId}`);
        
        // Get the election first to check its status
        const electionResult = await getElection(electionId);
        if (!electionResult.success) {
            throw new Error(electionResult.message);
        }
        
        const election = electionResult.data;
        
        // Check if election is in active status
        if (election.status !== 'ACTIVE') {
            return { success: false, message: `Cannot end election with status ${election.status}` };
        }
        
        // Connect to the network
        const connectionResult = await fabricConnection.connectToNetwork('Org1', 'admin');
        if (connectionResult.error) {
            throw new Error(connectionResult.error);
        }
        
        gateway = connectionResult.gateway;
        const network = connectionResult.network;
        
        // Get the contract
        const contractResult = fabricConnection.getContract(network, 'voting');
        if (contractResult.error) {
            throw new Error(contractResult.error);
        }
        
        const contract = contractResult.contract;
        
        // Update election status
        election.status = 'COMPLETED';
        
        // Submit the transaction to update the election
        await contract.submitTransaction('updateElection', electionId, JSON.stringify(election));
        
        console.log(`Election ${electionId} ended successfully`);
        return { success: true, message: `Election ${electionId} ended successfully`, data: election };
    } catch (error) {
        console.error(`Failed to end election: ${error.message}`);
        return { success: false, message: error.message };
    } finally {
        // Disconnect from the gateway
        if (gateway) {
            gateway.disconnect();
        }
    }
}

// Get election results
async function getElectionResults(electionId) {
    let gateway;
    try {
        console.log(`Getting results for election ${electionId}`);
        
        // Get the election first to check its status
        const electionResult = await getElection(electionId);
        if (!electionResult.success) {
            throw new Error(electionResult.message);
        }
        
        const election = electionResult.data;
        
        // Check if election is completed
        if (election.status !== 'COMPLETED') {
            return { success: false, message: `Cannot get results for election with status ${election.status}` };
        }
        
        // Connect to the network
        const connectionResult = await fabricConnection.connectToNetwork('Org1', 'admin');
        if (connectionResult.error) {
            throw new Error(connectionResult.error);
        }
        
        gateway = connectionResult.gateway;
        const network = connectionResult.network;
        
        // Get the contract
        const contractResult = fabricConnection.getContract(network, 'voting');
        if (contractResult.error) {
            throw new Error(contractResult.error);
        }
        
        const contract = contractResult.contract;
        
        // Query all votes for this election
        const votesResult = await contract.evaluateTransaction('getVotesByElection', electionId);
        const votes = JSON.parse(votesResult.toString());
        
        // Count votes for each candidate
        const results = {};
        election.candidates.forEach(candidate => {
            results[candidate.candidateId] = {
                candidate,
                voteCount: 0
            };
        });
        
        // Count votes
        votes.forEach(vote => {
            if (results[vote.candidateId]) {
                results[vote.candidateId].voteCount++;
            }
        });
        
        return { success: true, data: Object.values(results) };
    } catch (error) {
        console.error(`Failed to get election results: ${error.message}`);
        return { success: false, message: error.message };
    } finally {
        // Disconnect from the gateway
        if (gateway) {
            gateway.disconnect();
        }
    }
}

module.exports = {
    initialize,
    testConnection,
    registerVoter,
    getVoter,
    castVote,
    getElection,
    getAllElections,
    createElection,
    addCandidate,
    startElection,
    endElection,
    getElectionResults
};
