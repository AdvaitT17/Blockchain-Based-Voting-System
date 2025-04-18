'use strict';

const { Contract } = require('fabric-contract-api');

class VotingContract extends Contract {
    
    // Initialize the ledger
    async initLedger(ctx) {
        console.info('============= START : Initialize Ledger ===========');
        
        const elections = [
            {
                electionID: 'election1',
                name: 'General Election 2023',
                startTime: '2023-05-01T08:00:00Z',
                endTime: '2023-05-01T18:00:00Z',
                status: 'UPCOMING',
                constituencies: ['constituency1', 'constituency2']
            }
        ];
        
        for (const election of elections) {
            await ctx.stub.putState(election.electionID, Buffer.from(JSON.stringify(election)));
        }
        
        console.info('============= END : Initialize Ledger ===========');
    }
    
    // Create a new election
    async createElection(ctx, electionID, name, startTime, endTime, constituencies) {
        console.info('============= START : Create Election ===========');
        
        const election = {
            electionID,
            name,
            startTime,
            endTime,
            status: 'UPCOMING',
            constituencies: JSON.parse(constituencies)
        };
        
        await ctx.stub.putState(electionID, Buffer.from(JSON.stringify(election)));
        
        console.info('============= END : Create Election ===========');
        return JSON.stringify(election);
    }
    
    // Register a candidate
    async registerCandidate(ctx, candidateID, electionID, constituencyID, partyID, name) {
        console.info('============= START : Register Candidate ===========');
        
        const candidate = {
            candidateID,
            electionID,
            constituencyID,
            partyID,
            name,
            voteCount: 0
        };
        
        await ctx.stub.putState(candidateID, Buffer.from(JSON.stringify(candidate)));
        
        console.info('============= END : Register Candidate ===========');
        return JSON.stringify(candidate);
    }
    
    // Register a polling station
    async registerPollingStation(ctx, stationID, constituencyID, location) {
        console.info('============= START : Register Polling Station ===========');
        
        const station = {
            stationID,
            constituencyID,
            location,
            status: 'READY'
        };
        
        await ctx.stub.putState(stationID, Buffer.from(JSON.stringify(station)));
        
        console.info('============= END : Register Polling Station ===========');
        return JSON.stringify(station);
    }
    
    // Cast a vote
    async castVote(ctx, voteID, electionID, constituencyID, candidateID, voterTokenHash) {
        console.info('============= START : Cast Vote ===========');
        
        // Check if token has already been used
        const tokenKey = `token_${voterTokenHash}`;
        const tokenBytes = await ctx.stub.getState(tokenKey);
        if (tokenBytes && tokenBytes.length > 0) {
            throw new Error(`Token with hash ${voterTokenHash} has already been used`);
        }
        
        // Record that the token has been used
        await ctx.stub.putState(tokenKey, Buffer.from('used'));
        
        // Get the candidate
        const candidateBytes = await ctx.stub.getState(candidateID);
        if (!candidateBytes || candidateBytes.length === 0) {
            throw new Error(`Candidate ${candidateID} does not exist`);
        }
        const candidate = JSON.parse(candidateBytes.toString());
        
        // Increment vote count
        candidate.voteCount += 1;
        
        // Update candidate in the ledger
        await ctx.stub.putState(candidateID, Buffer.from(JSON.stringify(candidate)));
        
        // Create vote record with zero-knowledge proof
        // The actual vote is recorded, but not linked to the voter's identity
        const vote = {
            voteID,
            electionID,
            constituencyID,
            candidateID,
            timestamp: ctx.stub.getTxTimestamp(),
            zkProof: voterTokenHash.substring(0, 10) // Simplified ZK proof for demo
        };
        
        await ctx.stub.putState(voteID, Buffer.from(JSON.stringify(vote)));
        
        console.info('============= END : Cast Vote ===========');
        return JSON.stringify(vote);
    }
    
    // Get election results
    async getElectionResults(ctx, electionID) {
        console.info('============= START : Get Election Results ===========');
        
        const query = {
            selector: {
                electionID: electionID,
                candidateID: { $exists: true }
            }
        };
        
        const resultsIterator = await ctx.stub.getQueryResult(JSON.stringify(query));
        const results = [];
        
        let result = await resultsIterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
                results.push(record);
            } catch (err) {
                console.log(err);
            }
            result = await resultsIterator.next();
        }
        
        console.info('============= END : Get Election Results ===========');
        return JSON.stringify(results);
    }
    
    // Start an election
    async startElection(ctx, electionID) {
        console.info('============= START : Start Election ===========');
        
        const electionBytes = await ctx.stub.getState(electionID);
        if (!electionBytes || electionBytes.length === 0) {
            throw new Error(`Election ${electionID} does not exist`);
        }
        
        const election = JSON.parse(electionBytes.toString());
        election.status = 'IN_PROGRESS';
        election.startedAt = ctx.stub.getTxTimestamp();
        
        await ctx.stub.putState(electionID, Buffer.from(JSON.stringify(election)));
        
        console.info('============= END : Start Election ===========');
        return JSON.stringify(election);
    }
    
    // End an election
    async endElection(ctx, electionID) {
        console.info('============= START : End Election ===========');
        
        const electionBytes = await ctx.stub.getState(electionID);
        if (!electionBytes || electionBytes.length === 0) {
            throw new Error(`Election ${electionID} does not exist`);
        }
        
        const election = JSON.parse(electionBytes.toString());
        election.status = 'COMPLETED';
        election.endedAt = ctx.stub.getTxTimestamp();
        
        await ctx.stub.putState(electionID, Buffer.from(JSON.stringify(election)));
        
        console.info('============= END : End Election ===========');
        return JSON.stringify(election);
    }
    
    // Get election details
    async getElection(ctx, electionID) {
        console.info('============= START : Get Election ===========');
        
        const electionBytes = await ctx.stub.getState(electionID);
        if (!electionBytes || electionBytes.length === 0) {
            throw new Error(`Election ${electionID} does not exist`);
        }
        
        console.info('============= END : Get Election ===========');
        return electionBytes.toString();
    }
    
    // Get candidate details
    async getCandidate(ctx, candidateID) {
        console.info('============= START : Get Candidate ===========');
        
        const candidateBytes = await ctx.stub.getState(candidateID);
        if (!candidateBytes || candidateBytes.length === 0) {
            throw new Error(`Candidate ${candidateID} does not exist`);
        }
        
        console.info('============= END : Get Candidate ===========');
        return candidateBytes.toString();
    }
    
    // Get all candidates for an election
    async getCandidatesByElection(ctx, electionID) {
        console.info('============= START : Get Candidates By Election ===========');
        
        const query = {
            selector: {
                electionID: electionID,
                candidateID: { $exists: true }
            }
        };
        
        const resultsIterator = await ctx.stub.getQueryResult(JSON.stringify(query));
        const candidates = [];
        
        let result = await resultsIterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
                candidates.push(record);
            } catch (err) {
                console.log(err);
            }
            result = await resultsIterator.next();
        }
        
        console.info('============= END : Get Candidates By Election ===========');
        return JSON.stringify(candidates);
    }
}

module.exports = VotingContract;
