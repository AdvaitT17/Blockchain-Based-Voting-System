'use strict';

const { Contract } = require('fabric-contract-api');

class IdentityContract extends Contract {
    
    // Initialize the ledger
    async initLedger(ctx) {
        console.info('============= START : Initialize Ledger ===========');
        console.info('Identity chaincode initialized');
        console.info('============= END : Initialize Ledger ===========');
    }
    
    // Register a voter
    async registerVoter(ctx, voterIDHash, aadharHash, constituencyID, eligibilityStatus) {
        console.info('============= START : Register Voter ===========');
        
        // Check if voter already exists
        const voterBytes = await ctx.stub.getState(voterIDHash);
        if (voterBytes && voterBytes.length > 0) {
            throw new Error(`Voter with hash ${voterIDHash} already exists`);
        }
        
        const voter = {
            voterIDHash,
            aadharHash,
            constituencyID,
            eligibilityStatus: eligibilityStatus === 'true',
            isRegistered: true,
            registrationTimestamp: ctx.stub.getTxTimestamp()
        };
        
        await ctx.stub.putState(voterIDHash, Buffer.from(JSON.stringify(voter)));
        
        console.info('============= END : Register Voter ===========');
        return JSON.stringify(voter);
    }
    
    // Verify voter eligibility
    async verifyVoter(ctx, voterIDHash, electionID) {
        console.info('============= START : Verify Voter ===========');
        
        const voterBytes = await ctx.stub.getState(voterIDHash);
        if (!voterBytes || voterBytes.length === 0) {
            throw new Error(`Voter with hash ${voterIDHash} does not exist`);
        }
        
        const voter = JSON.parse(voterBytes.toString());
        
        // Check if voter is eligible
        if (!voter.eligibilityStatus) {
            throw new Error(`Voter with hash ${voterIDHash} is not eligible to vote`);
        }
        
        // Check if voter has already voted in this election
        const voteKey = `${electionID}_${voterIDHash}`;
        const voteBytes = await ctx.stub.getState(voteKey);
        if (voteBytes && voteBytes.length > 0) {
            throw new Error(`Voter with hash ${voterIDHash} has already voted in this election`);
        }
        
        console.info('============= END : Verify Voter ===========');
        return JSON.stringify({
            voterIDHash,
            constituencyID: voter.constituencyID,
            isEligible: true,
            verificationTimestamp: ctx.stub.getTxTimestamp()
        });
    }
    
    // Issue voting token
    async issueVotingToken(ctx, voterIDHash, electionID, tokenID, zkProof) {
        console.info('============= START : Issue Voting Token ===========');
        
        // Verify voter
        const voterBytes = await ctx.stub.getState(voterIDHash);
        if (!voterBytes || voterBytes.length === 0) {
            throw new Error(`Voter with hash ${voterIDHash} does not exist`);
        }
        
        const voter = JSON.parse(voterBytes.toString());
        
        // Check if voter is eligible
        if (!voter.eligibilityStatus) {
            throw new Error(`Voter with hash ${voterIDHash} is not eligible to vote`);
        }
        
        // Check if voter has already been issued a token for this election
        const tokenKey = `token_${electionID}_${voterIDHash}`;
        const tokenBytes = await ctx.stub.getState(tokenKey);
        if (tokenBytes && tokenBytes.length > 0) {
            throw new Error(`Voter with hash ${voterIDHash} has already been issued a token for this election`);
        }
        
        // Verify zero-knowledge proof
        // In a real implementation, this would perform cryptographic verification
        // For this example, we'll just check if the zkProof is provided
        if (!zkProof) {
            throw new Error('Zero-knowledge proof is required');
        }
        
        // Issue token
        const token = {
            tokenID,
            electionID,
            constituencyID: voter.constituencyID,
            issuedAt: ctx.stub.getTxTimestamp(),
            expiresAt: new Date(Date.now() + 3600000).toISOString(), // Token expires in 1 hour
            isUsed: false,
            zkProof
        };
        
        await ctx.stub.putState(tokenID, Buffer.from(JSON.stringify(token)));
        await ctx.stub.putState(tokenKey, Buffer.from(tokenID));
        
        console.info('============= END : Issue Voting Token ===========');
        return JSON.stringify(token);
    }
    
    // Use voting token
    async useVotingToken(ctx, tokenID) {
        console.info('============= START : Use Voting Token ===========');
        
        const tokenBytes = await ctx.stub.getState(tokenID);
        if (!tokenBytes || tokenBytes.length === 0) {
            throw new Error(`Token ${tokenID} does not exist`);
        }
        
        const token = JSON.parse(tokenBytes.toString());
        
        // Check if token has already been used
        if (token.isUsed) {
            throw new Error(`Token ${tokenID} has already been used`);
        }
        
        // Check if token has expired
        const currentTime = new Date();
        const expiryTime = new Date(token.expiresAt);
        if (currentTime > expiryTime) {
            throw new Error(`Token ${tokenID} has expired`);
        }
        
        // Mark token as used
        token.isUsed = true;
        token.usedAt = ctx.stub.getTxTimestamp();
        
        await ctx.stub.putState(tokenID, Buffer.from(JSON.stringify(token)));
        
        console.info('============= END : Use Voting Token ===========');
        return JSON.stringify(token);
    }
    
    // Verify token
    async verifyToken(ctx, tokenID) {
        console.info('============= START : Verify Token ===========');
        
        const tokenBytes = await ctx.stub.getState(tokenID);
        if (!tokenBytes || tokenBytes.length === 0) {
            throw new Error(`Token ${tokenID} does not exist`);
        }
        
        const token = JSON.parse(tokenBytes.toString());
        
        // Check if token has expired
        const currentTime = new Date();
        const expiryTime = new Date(token.expiresAt);
        const isExpired = currentTime > expiryTime;
        
        const verificationResult = {
            tokenID: token.tokenID,
            electionID: token.electionID,
            constituencyID: token.constituencyID,
            isUsed: token.isUsed,
            isExpired,
            isValid: !token.isUsed && !isExpired
        };
        
        console.info('============= END : Verify Token ===========');
        return JSON.stringify(verificationResult);
    }
    
    // Get voter details (private - only accessible to the voter)
    async getVoter(ctx, voterIDHash, aadharHash) {
        console.info('============= START : Get Voter ===========');
        
        const voterBytes = await ctx.stub.getState(voterIDHash);
        if (!voterBytes || voterBytes.length === 0) {
            throw new Error(`Voter with hash ${voterIDHash} does not exist`);
        }
        
        const voter = JSON.parse(voterBytes.toString());
        
        // Verify that the request is coming from the voter
        // In a real implementation, this would use a more sophisticated authentication mechanism
        if (voter.aadharHash !== aadharHash) {
            throw new Error('Unauthorized access to voter details');
        }
        
        console.info('============= END : Get Voter ===========');
        return JSON.stringify(voter);
    }
    
    // Get voter status (public - only shows if voter has voted, not who they voted for)
    async getVoterStatus(ctx, voterIDHash, electionID) {
        console.info('============= START : Get Voter Status ===========');
        
        const voterBytes = await ctx.stub.getState(voterIDHash);
        if (!voterBytes || voterBytes.length === 0) {
            throw new Error(`Voter with hash ${voterIDHash} does not exist`);
        }
        
        const voter = JSON.parse(voterBytes.toString());
        
        // Check if voter has voted in this election
        const voteKey = `token_${electionID}_${voterIDHash}`;
        const tokenBytes = await ctx.stub.getState(voteKey);
        const hasVoted = tokenBytes && tokenBytes.length > 0;
        
        const voterStatus = {
            voterIDHash,
            constituencyID: voter.constituencyID,
            hasVoted,
            electionID
        };
        
        console.info('============= END : Get Voter Status ===========');
        return JSON.stringify(voterStatus);
    }
    
    // Get constituency voter turnout
    async getConstituencyTurnout(ctx, constituencyID, electionID) {
        console.info('============= START : Get Constituency Turnout ===========');
        
        // Query to get all voters in the constituency
        const voterQuery = {
            selector: {
                constituencyID: constituencyID
            }
        };
        
        const voterIterator = await ctx.stub.getQueryResult(JSON.stringify(voterQuery));
        let totalVoters = 0;
        let votedVoters = 0;
        
        let voterResult = await voterIterator.next();
        while (!voterResult.done) {
            totalVoters++;
            
            const voter = JSON.parse(Buffer.from(voterResult.value.value.toString()).toString('utf8'));
            
            // Check if voter has voted in this election
            const voteKey = `token_${electionID}_${voter.voterIDHash}`;
            const tokenBytes = await ctx.stub.getState(voteKey);
            if (tokenBytes && tokenBytes.length > 0) {
                votedVoters++;
            }
            
            voterResult = await voterIterator.next();
        }
        
        const turnout = {
            constituencyID,
            electionID,
            totalVoters,
            votedVoters,
            percentage: totalVoters > 0 ? (votedVoters / totalVoters) * 100 : 0
        };
        
        console.info('============= END : Get Constituency Turnout ===========');
        return JSON.stringify(turnout);
    }
}

module.exports = IdentityContract;
