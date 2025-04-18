'use strict';

/**
 * Mock Blockchain Service
 * Simulates interactions with a blockchain network for testing purposes
 */

const fs = require('fs');
const path = require('path');

// In-memory storage for blockchain data
let blockchainData = {
    elections: [
        {
            electionId: 'EL001',
            name: 'General Election 2025',
            startDate: '2025-04-01', // Set to a past date to ensure it's active
            endDate: '2025-05-15',
            status: 'ACTIVE', // Changed from UPCOMING to ACTIVE for testing
            constituencies: ['Mumbai North', 'Mumbai South', 'Pune', 'Nagpur'],
            candidates: [
                { candidateId: 'C001', name: 'Candidate 1', party: 'Party A', constituencyId: 'Mumbai North' },
                { candidateId: 'C002', name: 'Candidate 2', party: 'Party B', constituencyId: 'Mumbai North' },
                { candidateId: 'C003', name: 'Candidate 3', party: 'Party A', constituencyId: 'Mumbai South' },
                { candidateId: 'C004', name: 'Candidate 4', party: 'Party B', constituencyId: 'Mumbai South' }
            ]
        }
    ],
    voters: {},
    votes: {}
};

// Data persistence
const DATA_FILE = path.join(__dirname, 'mock-blockchain-data.json');

// Load data if it exists
function loadData() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = fs.readFileSync(DATA_FILE, 'utf8');
            blockchainData = JSON.parse(data);
            console.log('Mock blockchain data loaded successfully');
        }
    } catch (error) {
        console.error(`Failed to load mock blockchain data: ${error.message}`);
    }
}

// Save data
function saveData() {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(blockchainData, null, 2), 'utf8');
    } catch (error) {
        console.error(`Failed to save mock blockchain data: ${error.message}`);
    }
}

// Initialize the mock blockchain
function initialize() {
    loadData();
    console.log('Mock blockchain initialized successfully');
    return Promise.resolve({ success: true, message: 'Mock blockchain initialized successfully' });
}

// Connect to the mock blockchain network
async function connectToNetwork(orgName, userName) {
    console.log(`Connecting to mock blockchain network as ${userName} from ${orgName}`);
    return {
        gateway: { disconnect: () => console.log('Mock gateway disconnected') },
        network: { getContract: (name) => ({ name }) }
    };
}

// Test connection to the mock blockchain
async function testConnection() {
    console.log('Testing connection to mock blockchain');
    return { success: true, message: 'Successfully connected to mock blockchain' };
}

// Register a voter
async function registerVoter(voterId, name, aadharId, votingDistrict) {
    console.log(`Registering voter ${voterId} with district ${votingDistrict}`);
    
    // Check if voter already exists
    if (blockchainData.voters[voterId]) {
        return { success: false, message: `Voter ${voterId} already exists` };
    }
    
    // Create new voter
    const voter = {
        voterId,
        name,
        aadharId,
        votingDistrict,
        constituencyId: votingDistrict, // Add constituency ID for compatibility
        registrationDate: new Date().toISOString(),
        status: 'REGISTERED',
        votedElections: [],
        hasVoted: false // Add hasVoted flag for compatibility
    };
    
    console.log('Created voter object:', voter);
    
    // Save voter
    blockchainData.voters[voterId] = voter;
    saveData();
    
    return { success: true, message: `Voter ${voterId} registered successfully`, data: voter };
}

// Get voter by ID
async function getVoter(voterId) {
    console.log(`Getting voter ${voterId}`);
    
    // Check if voter exists
    if (!blockchainData.voters[voterId]) {
        return { success: false, message: `Voter ${voterId} does not exist` };
    }
    
    console.log('Found voter:', blockchainData.voters[voterId]);
    
    return { success: true, data: blockchainData.voters[voterId] };
}

// Cast a vote
async function castVote(voterId, electionId, candidateId) {
    console.log(`Casting vote for election ${electionId} by voter ${voterId} for candidate ${candidateId}`);
    
    // Check if voter exists
    if (!blockchainData.voters[voterId]) {
        return { success: false, message: `Voter ${voterId} does not exist` };
    }
    
    // Check if election exists
    const election = blockchainData.elections.find(e => e.electionId === electionId);
    if (!election) {
        return { success: false, message: `Election ${electionId} does not exist` };
    }
    
    // Check if election is active
    if (election.status !== 'ACTIVE') {
        return { success: false, message: `Election ${electionId} is not active` };
    }
    
    // Check if voter has already voted in this election
    const voter = blockchainData.voters[voterId];
    if (voter.votedElections.includes(electionId)) {
        return { success: false, message: `Voter ${voterId} has already voted in election ${electionId}` };
    }
    
    // Check if candidate exists
    const candidateExists = election.candidates.some(c => c.candidateId === candidateId);
    if (!candidateExists) {
        return { success: false, message: `Candidate ${candidateId} does not exist in election ${electionId}` };
    }
    
    // Create vote
    const voteId = `VOTE_${Date.now()}_${voterId}_${electionId}`;
    const vote = {
        voteId,
        electionId,
        candidateId,
        timestamp: new Date().toISOString()
    };
    
    // Update voter
    voter.votedElections.push(electionId);
    
    // Save vote
    blockchainData.votes[voteId] = vote;
    saveData();
    
    return { success: true, message: `Vote cast successfully`, data: vote };
}

// Get election by ID
async function getElection(electionId) {
    console.log(`Getting election ${electionId}`);
    
    // Find election
    const election = blockchainData.elections.find(e => e.electionId === electionId);
    if (!election) {
        return { success: false, message: `Election ${electionId} does not exist` };
    }
    
    return { success: true, data: election };
}

// Get all elections
async function getAllElections() {
    console.log('Getting all elections');
    return { success: true, data: blockchainData.elections };
}

// Create a new election
async function createElection(electionId, name, startDate, endDate, constituencies) {
    console.log(`Creating election ${electionId}`);
    
    // Check if election already exists
    if (blockchainData.elections.some(e => e.electionId === electionId)) {
        return { success: false, message: `Election ${electionId} already exists` };
    }
    
    // Create new election
    const election = {
        electionId,
        name,
        startDate,
        endDate,
        status: 'UPCOMING',
        constituencies: Array.isArray(constituencies) ? constituencies : JSON.parse(constituencies),
        candidates: []
    };
    
    // Save election
    blockchainData.elections.push(election);
    saveData();
    
    return { success: true, message: `Election ${electionId} created successfully`, data: election };
}

// Add a candidate to an election
async function addCandidate(electionId, candidateId, name, party, constituencyId) {
    console.log(`Adding candidate ${candidateId} to election ${electionId}`);
    
    // Find election
    const electionIndex = blockchainData.elections.findIndex(e => e.electionId === electionId);
    if (electionIndex === -1) {
        return { success: false, message: `Election ${electionId} does not exist` };
    }
    
    const election = blockchainData.elections[electionIndex];
    
    // Check if election is in upcoming status
    if (election.status !== 'UPCOMING') {
        return { success: false, message: `Cannot add candidates to election with status ${election.status}` };
    }
    
    // Check if constituency exists
    if (!election.constituencies.includes(constituencyId)) {
        return { success: false, message: `Constituency ${constituencyId} does not exist in election ${electionId}` };
    }
    
    // Check if candidate already exists
    if (election.candidates.some(c => c.candidateId === candidateId)) {
        return { success: false, message: `Candidate ${candidateId} already exists in election ${electionId}` };
    }
    
    // Create candidate
    const candidate = {
        candidateId,
        name,
        party,
        constituencyId
    };
    
    // Add candidate to election
    election.candidates.push(candidate);
    saveData();
    
    return { success: true, message: `Candidate ${candidateId} added to election ${electionId} successfully`, data: candidate };
}

// Start an election
async function startElection(electionId) {
    console.log(`Starting election ${electionId}`);
    
    // Find election
    const electionIndex = blockchainData.elections.findIndex(e => e.electionId === electionId);
    if (electionIndex === -1) {
        return { success: false, message: `Election ${electionId} does not exist` };
    }
    
    const election = blockchainData.elections[electionIndex];
    
    // Check if election is in upcoming status
    if (election.status !== 'UPCOMING') {
        return { success: false, message: `Cannot start election with status ${election.status}` };
    }
    
    // Update election status
    election.status = 'ACTIVE';
    saveData();
    
    return { success: true, message: `Election ${electionId} started successfully`, data: election };
}

// End an election
async function endElection(electionId) {
    console.log(`Ending election ${electionId}`);
    
    // Find election
    const electionIndex = blockchainData.elections.findIndex(e => e.electionId === electionId);
    if (electionIndex === -1) {
        return { success: false, message: `Election ${electionId} does not exist` };
    }
    
    const election = blockchainData.elections[electionIndex];
    
    // Check if election is in active status
    if (election.status !== 'ACTIVE') {
        return { success: false, message: `Cannot end election with status ${election.status}` };
    }
    
    // Update election status
    election.status = 'COMPLETED';
    saveData();
    
    return { success: true, message: `Election ${electionId} ended successfully`, data: election };
}

// Get election results
async function getElectionResults(electionId) {
    console.log(`Getting results for election ${electionId}`);
    
    // Find election
    const election = blockchainData.elections.find(e => e.electionId === electionId);
    if (!election) {
        return { success: false, message: `Election ${electionId} does not exist` };
    }
    
    // Check if election is completed
    if (election.status !== 'COMPLETED') {
        return { success: false, message: `Cannot get results for election with status ${election.status}` };
    }
    
    // Count votes for each candidate
    const results = {};
    election.candidates.forEach(candidate => {
        results[candidate.candidateId] = {
            candidate,
            voteCount: 0
        };
    });
    
    // Count votes
    Object.values(blockchainData.votes).forEach(vote => {
        if (vote.electionId === electionId && results[vote.candidateId]) {
            results[vote.candidateId].voteCount++;
        }
    });
    
    return { success: true, data: Object.values(results) };
}

module.exports = {
    initialize,
    connectToNetwork,
    registerVoter,
    getVoter,
    castVote,
    getElection,
    getAllElections,
    createElection,
    addCandidate,
    startElection,
    endElection,
    getElectionResults,
    testConnection
};
