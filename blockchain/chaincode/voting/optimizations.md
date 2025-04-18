# Chaincode Optimization Guide
## Blockchain-Based Voting System

This document outlines the optimization strategies implemented in the voting chaincode to improve performance, scalability, and resource utilization.

## Table of Contents
1. [State Access Patterns](#state-access-patterns)
2. [Composite Keys](#composite-keys)
3. [CouchDB Indexes](#couchdb-indexes)
4. [Batch Operations](#batch-operations)
5. [Private Data Collections](#private-data-collections)
6. [Rich Queries Optimization](#rich-queries-optimization)
7. [Endorsement Policy Optimization](#endorsement-policy-optimization)

## State Access Patterns

### Problem
Inefficient state access patterns can lead to excessive reads and writes, increasing transaction latency and reducing throughput.

### Solution
We've implemented the following optimizations:

1. **Read-Before-Write Reduction**:
   - Only read state when necessary for validation or computation
   - Avoid redundant state reads within the same transaction

2. **Partial State Updates**:
   - Update only the specific fields that have changed
   - Use partial composite keys for targeted queries

3. **State Caching**:
   - Cache frequently accessed state within the chaincode
   - Implement TTL (Time-To-Live) for cached state

### Implementation Example
```go
// Before optimization
func (s *SmartContract) CastVote(ctx contractapi.TransactionContextInterface, electionId string, candidateId string, voterId string, pollingStationId string) error {
    // Get election
    electionBytes, err := ctx.GetStub().GetState(electionKey(electionId))
    if err != nil {
        return fmt.Errorf("failed to read election: %v", err)
    }
    if electionBytes == nil {
        return fmt.Errorf("election does not exist: %s", electionId)
    }
    var election Election
    err = json.Unmarshal(electionBytes, &election)
    if err != nil {
        return fmt.Errorf("failed to unmarshal election: %v", err)
    }

    // Get candidate
    candidateBytes, err := ctx.GetStub().GetState(candidateKey(candidateId))
    if err != nil {
        return fmt.Errorf("failed to read candidate: %v", err)
    }
    if candidateBytes == nil {
        return fmt.Errorf("candidate does not exist: %s", candidateId)
    }
    var candidate Candidate
    err = json.Unmarshal(candidateBytes, &candidate)
    if err != nil {
        return fmt.Errorf("failed to unmarshal candidate: %v", err)
    }

    // More state reads...
}

// After optimization
func (s *SmartContract) CastVote(ctx contractapi.TransactionContextInterface, electionId string, candidateId string, voterId string, pollingStationId string) error {
    // Check if voter has already voted (composite key check is faster)
    hasVotedIterator, err := ctx.GetStub().GetStateByPartialCompositeKey("election~voter~voted", []string{electionId, voterId})
    if err != nil {
        return fmt.Errorf("failed to check if voter has voted: %v", err)
    }
    defer hasVotedIterator.Close()
    if hasVotedIterator.HasNext() {
        return fmt.Errorf("voter has already voted in this election")
    }

    // Only read election status (not the entire election object)
    electionStatusBytes, err := ctx.GetStub().GetState(electionStatusKey(electionId))
    if err != nil {
        return fmt.Errorf("failed to read election status: %v", err)
    }
    if electionStatusBytes == nil {
        return fmt.Errorf("election does not exist: %s", electionId)
    }
    if string(electionStatusBytes) != "ACTIVE" {
        return fmt.Errorf("election is not active")
    }

    // Only verify candidate exists in this election (using composite key)
    candidateIterator, err := ctx.GetStub().GetStateByPartialCompositeKey("election~candidate", []string{electionId, candidateId})
    if err != nil {
        return fmt.Errorf("failed to verify candidate: %v", err)
    }
    defer candidateIterator.Close()
    if !candidateIterator.HasNext() {
        return fmt.Errorf("candidate does not exist in this election")
    }

    // Rest of the function...
}
```

## Composite Keys

### Problem
Using simple keys for related data makes it difficult to query relationships efficiently, leading to multiple separate queries and increased latency.

### Solution
We've implemented composite keys for related data to enable efficient queries and reduce the number of state operations:

1. **Election-Candidate Relationship**:
   - Composite Key: `election~candidate~{electionId}~{candidateId}`
   - Enables efficient queries for candidates by election

2. **Election-Voter Relationship**:
   - Composite Key: `election~voter~voted~{electionId}~{voterId}`
   - Enables efficient checking if a voter has voted in an election

3. **Constituency-Candidate Relationship**:
   - Composite Key: `constituency~candidate~{constituencyId}~{candidateId}~{electionId}`
   - Enables efficient queries for candidates by constituency and election

### Implementation Example
```go
// Create composite keys for efficient querying
func (s *SmartContract) AddCandidate(ctx contractapi.TransactionContextInterface, candidateId string, name string, party string, electionId string, constituencyId string) error {
    // Create candidate object and store it
    // ...

    // Create composite keys for efficient querying
    electionCandidateKey, err := ctx.GetStub().CreateCompositeKey("election~candidate", []string{electionId, candidateId})
    if err != nil {
        return fmt.Errorf("failed to create composite key: %v", err)
    }
    err = ctx.GetStub().PutState(electionCandidateKey, []byte{0}) // Use empty value to save space
    if err != nil {
        return fmt.Errorf("failed to put election-candidate index: %v", err)
    }

    constituencyCandidateKey, err := ctx.GetStub().CreateCompositeKey("constituency~candidate", []string{constituencyId, candidateId, electionId})
    if err != nil {
        return fmt.Errorf("failed to create composite key: %v", err)
    }
    err = ctx.GetStub().PutState(constituencyCandidateKey, []byte{0})
    if err != nil {
        return fmt.Errorf("failed to put constituency-candidate index: %v", err)
    }

    return nil
}

// Query using composite keys
func (s *SmartContract) GetCandidatesByElection(ctx contractapi.TransactionContextInterface, electionId string) ([]*Candidate, error) {
    // Query using composite key
    resultsIterator, err := ctx.GetStub().GetStateByPartialCompositeKey("election~candidate", []string{electionId})
    if err != nil {
        return nil, fmt.Errorf("failed to get candidates: %v", err)
    }
    defer resultsIterator.Close()

    var candidates []*Candidate
    for resultsIterator.HasNext() {
        queryResponse, err := resultsIterator.Next()
        if err != nil {
            return nil, fmt.Errorf("failed to iterate candidates: %v", err)
        }

        _, compositeKeyParts, err := ctx.GetStub().SplitCompositeKey(queryResponse.Key)
        if err != nil {
            return nil, fmt.Errorf("failed to split composite key: %v", err)
        }

        candidateId := compositeKeyParts[1]
        candidateBytes, err := ctx.GetStub().GetState(candidateKey(candidateId))
        if err != nil {
            return nil, fmt.Errorf("failed to get candidate: %v", err)
        }

        var candidate Candidate
        err = json.Unmarshal(candidateBytes, &candidate)
        if err != nil {
            return nil, fmt.Errorf("failed to unmarshal candidate: %v", err)
        }

        candidates = append(candidates, &candidate)
    }

    return candidates, nil
}
```

## CouchDB Indexes

### Problem
Without proper indexes, rich queries on CouchDB state database can be slow, especially as the state grows.

### Solution
We've defined CouchDB indexes for frequently queried fields to improve query performance:

1. **Election Status Index**:
   - Enables efficient queries for active elections

2. **Constituency Elections Index**:
   - Enables efficient queries for elections by constituency

3. **Candidate Votes Index**:
   - Enables efficient sorting of candidates by vote count

### Implementation Example
```json
// indexes/electionStatusIndex.json
{
    "index": {
        "fields": ["docType", "status"]
    },
    "ddoc": "electionStatusIndex",
    "name": "electionStatusIndex",
    "type": "json"
}

// indexes/constituencyElectionsIndex.json
{
    "index": {
        "fields": ["docType", "constituencies"]
    },
    "ddoc": "constituencyElectionsIndex",
    "name": "constituencyElectionsIndex",
    "type": "json"
}

// indexes/candidateVotesIndex.json
{
    "index": {
        "fields": ["docType", "electionId", "constituencyId", "voteCount"]
    },
    "ddoc": "candidateVotesIndex",
    "name": "candidateVotesIndex",
    "type": "json"
}
```

```go
// Using indexes in rich queries
func (s *SmartContract) GetActiveElections(ctx contractapi.TransactionContextInterface) ([]*Election, error) {
    queryString := `{
        "selector": {
            "docType": "election",
            "status": "ACTIVE"
        },
        "use_index": ["electionStatusIndex"]
    }`

    return getElectionsByQuery(ctx, queryString)
}

func (s *SmartContract) GetElectionsByConstituency(ctx contractapi.TransactionContextInterface, constituencyId string) ([]*Election, error) {
    queryString := fmt.Sprintf(`{
        "selector": {
            "docType": "election",
            "constituencies": {
                "$elemMatch": {
                    "$eq": "%s"
                }
            }
        },
        "use_index": ["constituencyElectionsIndex"]
    }`, constituencyId)

    return getElectionsByQuery(ctx, queryString)
}

func (s *SmartContract) GetCandidateResultsByVotes(ctx contractapi.TransactionContextInterface, electionId string, constituencyId string) ([]*CandidateResult, error) {
    queryString := fmt.Sprintf(`{
        "selector": {
            "docType": "candidateResult",
            "electionId": "%s",
            "constituencyId": "%s"
        },
        "sort": [{"voteCount": "desc"}],
        "use_index": ["candidateVotesIndex"]
    }`, electionId, constituencyId)

    return getCandidateResultsByQuery(ctx, queryString)
}
```

## Batch Operations

### Problem
Processing individual transactions for bulk operations can lead to high latency and reduced throughput.

### Solution
We've implemented batch processing for operations that involve multiple related state changes:

1. **Batch Vote Counting**:
   - Update vote counts in batches rather than individually
   - Use composite keys to track batches

2. **Batch Candidate Registration**:
   - Register multiple candidates in a single transaction
   - Create all required composite keys in one go

### Implementation Example
```go
// Batch candidate registration
func (s *SmartContract) RegisterCandidatesBatch(ctx contractapi.TransactionContextInterface, candidatesJSON string) error {
    var candidates []Candidate
    err := json.Unmarshal([]byte(candidatesJSON), &candidates)
    if err != nil {
        return fmt.Errorf("failed to unmarshal candidates: %v", err)
    }

    for _, candidate := range candidates {
        candidateBytes, err := json.Marshal(candidate)
        if err != nil {
            return fmt.Errorf("failed to marshal candidate: %v", err)
        }

        err = ctx.GetStub().PutState(candidateKey(candidate.CandidateId), candidateBytes)
        if err != nil {
            return fmt.Errorf("failed to put candidate state: %v", err)
        }

        // Create composite keys for each candidate
        electionCandidateKey, err := ctx.GetStub().CreateCompositeKey("election~candidate", []string{candidate.ElectionId, candidate.CandidateId})
        if err != nil {
            return fmt.Errorf("failed to create composite key: %v", err)
        }
        err = ctx.GetStub().PutState(electionCandidateKey, []byte{0})
        if err != nil {
            return fmt.Errorf("failed to put election-candidate index: %v", err)
        }

        constituencyCandidateKey, err := ctx.GetStub().CreateCompositeKey("constituency~candidate", []string{candidate.ConstituencyId, candidate.CandidateId, candidate.ElectionId})
        if err != nil {
            return fmt.Errorf("failed to create composite key: %v", err)
        }
        err = ctx.GetStub().PutState(constituencyCandidateKey, []byte{0})
        if err != nil {
            return fmt.Errorf("failed to put constituency-candidate index: %v", err)
        }
    }

    return nil
}
```

## Private Data Collections

### Problem
Storing sensitive voter data on the public ledger raises privacy concerns and increases the ledger size.

### Solution
We've implemented private data collections for sensitive voter information:

1. **Voter Identity Collection**:
   - Stores sensitive voter identity information (Aadhar hash, biometric verification)
   - Accessible only to authorized organizations

2. **Vote Records Collection**:
   - Stores the mapping between voters and their votes
   - Accessible only to election commission

### Implementation Example
```go
// collections_config.json
[
    {
        "name": "voterIdentityCollection",
        "policy": "OR('ElectionCommissionMSP.member', 'IdentityVerifierMSP.member')",
        "requiredPeerCount": 1,
        "maxPeerCount": 3,
        "blockToLive": 0,
        "memberOnlyRead": true,
        "memberOnlyWrite": true,
        "endorsementPolicy": {
            "signaturePolicy": "OR('ElectionCommissionMSP.member', 'IdentityVerifierMSP.member')"
        }
    },
    {
        "name": "voteRecordsCollection",
        "policy": "OR('ElectionCommissionMSP.member')",
        "requiredPeerCount": 1,
        "maxPeerCount": 3,
        "blockToLive": 0,
        "memberOnlyRead": true,
        "memberOnlyWrite": true,
        "endorsementPolicy": {
            "signaturePolicy": "OR('ElectionCommissionMSP.member')"
        }
    }
]
```

```go
// Using private data collections
func (s *SmartContract) VerifyVoter(ctx contractapi.TransactionContextInterface, voterId string, aadharHash string) (bool, error) {
    // Get voter identity from private data collection
    voterBytes, err := ctx.GetStub().GetPrivateData("voterIdentityCollection", voterId)
    if err != nil {
        return false, fmt.Errorf("failed to read voter identity: %v", err)
    }
    if voterBytes == nil {
        return false, fmt.Errorf("voter does not exist: %s", voterId)
    }

    var voterIdentity VoterIdentity
    err = json.Unmarshal(voterBytes, &voterIdentity)
    if err != nil {
        return false, fmt.Errorf("failed to unmarshal voter identity: %v", err)
    }

    // Verify Aadhar hash
    if voterIdentity.AadharHash != aadharHash {
        return false, nil
    }

    return true, nil
}

func (s *SmartContract) CastVote(ctx contractapi.TransactionContextInterface, electionId string, candidateId string, voterId string, pollingStationId string) error {
    // Check if voter has already voted
    hasVoted, err := s.HasVoted(ctx, electionId, voterId)
    if err != nil {
        return fmt.Errorf("failed to check if voter has voted: %v", err)
    }
    if hasVoted {
        return fmt.Errorf("voter has already voted in this election")
    }

    // Record vote in private data collection
    voteRecord := VoteRecord{
        ElectionId: electionId,
        VoterId: voterId,
        CandidateId: candidateId,
        Timestamp: time.Now().Format(time.RFC3339),
        PollingStationId: pollingStationId
    }
    voteRecordBytes, err := json.Marshal(voteRecord)
    if err != nil {
        return fmt.Errorf("failed to marshal vote record: %v", err)
    }

    // Store in private data collection
    err = ctx.GetStub().PutPrivateData("voteRecordsCollection", fmt.Sprintf("%s~%s", electionId, voterId), voteRecordBytes)
    if err != nil {
        return fmt.Errorf("failed to record vote: %v", err)
    }

    // Update vote count (public data)
    voteCountKey := fmt.Sprintf("voteCount~%s~%s", electionId, candidateId)
    voteCountBytes, err := ctx.GetStub().GetState(voteCountKey)
    var voteCount int
    if err != nil {
        return fmt.Errorf("failed to read vote count: %v", err)
    }
    if voteCountBytes == nil {
        voteCount = 1
    } else {
        voteCount, err = strconv.Atoi(string(voteCountBytes))
        if err != nil {
            return fmt.Errorf("failed to parse vote count: %v", err)
        }
        voteCount++
    }

    err = ctx.GetStub().PutState(voteCountKey, []byte(strconv.Itoa(voteCount)))
    if err != nil {
        return fmt.Errorf("failed to update vote count: %v", err)
    }

    // Create composite key to mark voter as having voted
    votedKey, err := ctx.GetStub().CreateCompositeKey("election~voter~voted", []string{electionId, voterId})
    if err != nil {
        return fmt.Errorf("failed to create composite key: %v", err)
    }
    err = ctx.GetStub().PutState(votedKey, []byte{0})
    if err != nil {
        return fmt.Errorf("failed to mark voter as voted: %v", err)
    }

    return nil
}
```

## Rich Queries Optimization

### Problem
Inefficient rich queries can be slow and consume excessive resources, especially with large datasets.

### Solution
We've optimized rich queries to improve performance:

1. **Query Limiting**:
   - Add limits to queries to prevent excessive result sets
   - Implement pagination for large result sets

2. **Query Projection**:
   - Only select the fields that are needed in the query results
   - Reduce the amount of data transferred

3. **Query Caching**:
   - Cache frequently used query results
   - Invalidate cache when relevant state changes

### Implementation Example
```go
// Optimized rich query with pagination
func (s *SmartContract) GetCandidatesByConstituencyPaginated(ctx contractapi.TransactionContextInterface, constituencyId string, electionId string, pageSize int, bookmark string) (*PaginatedQueryResult, error) {
    queryString := fmt.Sprintf(`{
        "selector": {
            "docType": "candidate",
            "constituencyId": "%s",
            "electionId": "%s"
        },
        "fields": ["candidateId", "name", "party"],
        "use_index": ["constituencyElectionsIndex"]
    }`, constituencyId, electionId)

    // Execute paginated query
    pageSize32 := int32(pageSize)
    resultsIterator, responseMetadata, err := ctx.GetStub().GetQueryResultWithPagination(queryString, pageSize32, bookmark)
    if err != nil {
        return nil, fmt.Errorf("failed to get candidates: %v", err)
    }
    defer resultsIterator.Close()

    // Process results
    var candidates []*Candidate
    for resultsIterator.HasNext() {
        queryResponse, err := resultsIterator.Next()
        if err != nil {
            return nil, fmt.Errorf("failed to iterate candidates: %v", err)
        }

        var candidate Candidate
        err = json.Unmarshal(queryResponse.Value, &candidate)
        if err != nil {
            return nil, fmt.Errorf("failed to unmarshal candidate: %v", err)
        }

        candidates = append(candidates, &candidate)
    }

    return &PaginatedQueryResult{
        Records: candidates,
        Bookmark: responseMetadata.Bookmark,
        RecordsCount: int(responseMetadata.FetchedRecordsCount),
    }, nil
}
```

## Endorsement Policy Optimization

### Problem
Overly restrictive endorsement policies can reduce transaction throughput and increase latency, while overly permissive policies can compromise security.

### Solution
We've optimized endorsement policies based on transaction criticality:

1. **Tiered Endorsement Policies**:
   - Critical operations (e.g., election creation, vote casting) require multiple endorsements
   - Read-only operations require fewer endorsements

2. **Function-Specific Endorsement**:
   - Different chaincode functions have different endorsement requirements
   - Balance between security and performance

### Implementation Example
```go
// chaincode-definition.json
{
    "name": "votingChaincode",
    "version": "1.0",
    "sequence": 1,
    "endorsementPlugin": "escc",
    "validationPlugin": "vscc",
    "endorsementPolicy": {
        "signaturePolicy": "OR('ElectionCommissionMSP.peer')"
    },
    "collectionConfig": [...],
    "initRequired": false,
    "function-specific-endorsement": {
        "CastVote": "AND('ElectionCommissionMSP.peer', 'PollingStationMSP.peer')",
        "CreateElection": "AND('ElectionCommissionMSP.peer', 'GovernmentMSP.peer')",
        "EndElection": "AND('ElectionCommissionMSP.peer', 'GovernmentMSP.peer')",
        "GetElection": "OR('ElectionCommissionMSP.peer', 'PollingStationMSP.peer', 'GovernmentMSP.peer')",
        "GetActiveElections": "OR('ElectionCommissionMSP.peer', 'PollingStationMSP.peer', 'GovernmentMSP.peer')"
    }
}
```

---

By implementing these optimizations, we've significantly improved the performance and scalability of the voting chaincode, enabling it to handle large-scale elections with improved throughput and reduced latency.

For more information on implementing these optimizations, refer to the chaincode implementation in the `chaincode/voting` directory.
