package main

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// VotingContract provides functions for managing elections and votes
type VotingContract struct {
	contractapi.Contract
}

// Election represents an election
type Election struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	StartTime   time.Time `json:"startTime"`
	EndTime     time.Time `json:"endTime"`
	Status      string    `json:"status"` // "created", "active", "ended"
	Candidates  []string  `json:"candidates"`
}

// Candidate represents a candidate in an election
type Candidate struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Party       string `json:"party"`
	Constituency string `json:"constituency"`
}

// Voter represents a registered voter
type Voter struct {
	ID           string `json:"id"` // Aadhar or Voter ID
	Name         string `json:"name"`
	Constituency string `json:"constituency"`
	HasVoted     bool   `json:"hasVoted"`
}

// Vote represents a cast vote
type Vote struct {
	ElectionID  string    `json:"electionId"`
	VoterID     string    `json:"voterId"`
	CandidateID string    `json:"candidateId"`
	Timestamp   time.Time `json:"timestamp"`
}

// ElectionResult represents the result of an election
type ElectionResult struct {
	ElectionID  string         `json:"electionId"`
	TotalVotes  int            `json:"totalVotes"`
	CandidateResults []CandidateResult `json:"candidateResults"`
}

// CandidateResult represents the result for a candidate
type CandidateResult struct {
	CandidateID string `json:"candidateId"`
	VoteCount   int    `json:"voteCount"`
}

// InitLedger adds a base set of assets to the ledger
func (s *VotingContract) InitLedger(ctx contractapi.TransactionContextInterface) error {
	return nil
}

// CreateElection creates a new election
func (s *VotingContract) CreateElection(ctx contractapi.TransactionContextInterface, id string, name string, description string, startTimeStr string, endTimeStr string, candidatesJSON string) error {
	exists, err := s.ElectionExists(ctx, id)
	if err != nil {
		return err
	}
	if exists {
		return fmt.Errorf("the election %s already exists", id)
	}

	startTime, err := time.Parse(time.RFC3339, startTimeStr)
	if err != nil {
		return fmt.Errorf("invalid start time format: %v", err)
	}

	endTime, err := time.Parse(time.RFC3339, endTimeStr)
	if err != nil {
		return fmt.Errorf("invalid end time format: %v", err)
	}

	var candidates []string
	err = json.Unmarshal([]byte(candidatesJSON), &candidates)
	if err != nil {
		return fmt.Errorf("invalid candidates JSON: %v", err)
	}

	election := Election{
		ID:          id,
		Name:        name,
		Description: description,
		StartTime:   startTime,
		EndTime:     endTime,
		Status:      "created",
		Candidates:  candidates,
	}

	electionJSON, err := json.Marshal(election)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(id, electionJSON)
}

// ElectionExists returns true when election with given ID exists in world state
func (s *VotingContract) ElectionExists(ctx contractapi.TransactionContextInterface, id string) (bool, error) {
	electionJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
		return false, fmt.Errorf("failed to read from world state: %v", err)
	}

	return electionJSON != nil, nil
}

// GetElection returns the election stored in the world state with given id
func (s *VotingContract) GetElection(ctx contractapi.TransactionContextInterface, id string) (*Election, error) {
	electionJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
		return nil, fmt.Errorf("failed to read from world state: %v", err)
	}
	if electionJSON == nil {
		return nil, fmt.Errorf("the election %s does not exist", id)
	}

	var election Election
	err = json.Unmarshal(electionJSON, &election)
	if err != nil {
		return nil, err
	}

	return &election, nil
}

// UpdateElectionStatus updates the status of an election
func (s *VotingContract) UpdateElectionStatus(ctx contractapi.TransactionContextInterface, id string, status string) error {
	election, err := s.GetElection(ctx, id)
	if err != nil {
		return err
	}

	if status != "created" && status != "active" && status != "ended" {
		return fmt.Errorf("invalid status: %s. Status must be 'created', 'active', or 'ended'", status)
	}

	election.Status = status

	electionJSON, err := json.Marshal(election)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(id, electionJSON)
}

// GetAllElections returns all elections found in world state
func (s *VotingContract) GetAllElections(ctx contractapi.TransactionContextInterface) ([]*Election, error) {
	resultsIterator, err := ctx.GetStub().GetStateByRange("", "")
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var elections []*Election
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var election Election
		err = json.Unmarshal(queryResponse.Value, &election)
		if err != nil {
			continue // Skip non-election assets
		}
		elections = append(elections, &election)
	}

	return elections, nil
}

// RegisterCandidate registers a new candidate
func (s *VotingContract) RegisterCandidate(ctx contractapi.TransactionContextInterface, id string, name string, party string, constituency string) error {
	candidateKey := "CANDIDATE_" + id
	
	candidateJSON, err := ctx.GetStub().GetState(candidateKey)
	if err != nil {
		return fmt.Errorf("failed to read from world state: %v", err)
	}
	if candidateJSON != nil {
		return fmt.Errorf("the candidate %s already exists", id)
	}

	candidate := Candidate{
		ID:          id,
		Name:        name,
		Party:       party,
		Constituency: constituency,
	}

	candidateJSON, err = json.Marshal(candidate)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(candidateKey, candidateJSON)
}

// GetCandidate returns the candidate stored in the world state with given id
func (s *VotingContract) GetCandidate(ctx contractapi.TransactionContextInterface, id string) (*Candidate, error) {
	candidateKey := "CANDIDATE_" + id
	
	candidateJSON, err := ctx.GetStub().GetState(candidateKey)
	if err != nil {
		return nil, fmt.Errorf("failed to read from world state: %v", err)
	}
	if candidateJSON == nil {
		return nil, fmt.Errorf("the candidate %s does not exist", id)
	}

	var candidate Candidate
	err = json.Unmarshal(candidateJSON, &candidate)
	if err != nil {
		return nil, err
	}

	return &candidate, nil
}

// RegisterVoter registers a new voter
func (s *VotingContract) RegisterVoter(ctx contractapi.TransactionContextInterface, id string, name string, constituency string) error {
	voterKey := "VOTER_" + id
	
	voterJSON, err := ctx.GetStub().GetState(voterKey)
	if err != nil {
		return fmt.Errorf("failed to read from world state: %v", err)
	}
	if voterJSON != nil {
		return fmt.Errorf("the voter %s already exists", id)
	}

	voter := Voter{
		ID:           id,
		Name:         name,
		Constituency: constituency,
		HasVoted:     false,
	}

	voterJSON, err = json.Marshal(voter)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(voterKey, voterJSON)
}

// GetVoter returns the voter stored in the world state with given id
func (s *VotingContract) GetVoter(ctx contractapi.TransactionContextInterface, id string) (*Voter, error) {
	voterKey := "VOTER_" + id
	
	voterJSON, err := ctx.GetStub().GetState(voterKey)
	if err != nil {
		return nil, fmt.Errorf("failed to read from world state: %v", err)
	}
	if voterJSON == nil {
		return nil, fmt.Errorf("the voter %s does not exist", id)
	}

	var voter Voter
	err = json.Unmarshal(voterJSON, &voter)
	if err != nil {
		return nil, err
	}

	return &voter, nil
}

// CastVote casts a vote for a candidate in an election
func (s *VotingContract) CastVote(ctx contractapi.TransactionContextInterface, electionID string, voterID string, candidateID string) error {
	// Check if election exists and is active
	election, err := s.GetElection(ctx, electionID)
	if err != nil {
		return err
	}
	if election.Status != "active" {
		return fmt.Errorf("election is not active")
	}

	// Check if current time is within election period
	currentTime := time.Now()
	if currentTime.Before(election.StartTime) || currentTime.After(election.EndTime) {
		return fmt.Errorf("election is not currently open for voting")
	}

	// Check if voter exists
	voter, err := s.GetVoter(ctx, voterID)
	if err != nil {
		return err
	}

	// Check if voter has already voted
	if voter.HasVoted {
		return fmt.Errorf("voter has already cast a vote")
	}

	// Check if candidate exists and is part of the election
	_, err = s.GetCandidate(ctx, candidateID)
	if err != nil {
		return err
	}

	// Check if candidate is in the election
	candidateFound := false
	for _, cID := range election.Candidates {
		if cID == candidateID {
			candidateFound = true
			break
		}
	}
	if !candidateFound {
		return fmt.Errorf("candidate is not part of this election")
	}

	// Create vote
	voteKey := "VOTE_" + electionID + "_" + voterID
	vote := Vote{
		ElectionID:  electionID,
		VoterID:     voterID,
		CandidateID: candidateID,
		Timestamp:   currentTime,
	}

	voteJSON, err := json.Marshal(vote)
	if err != nil {
		return err
	}

	// Update voter's status
	voter.HasVoted = true
	voterJSON, err := json.Marshal(voter)
	if err != nil {
		return err
	}

	// Store vote and update voter status
	err = ctx.GetStub().PutState(voteKey, voteJSON)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState("VOTER_"+voterID, voterJSON)
}

// GetElectionResults gets the results of an election
func (s *VotingContract) GetElectionResults(ctx contractapi.TransactionContextInterface, electionID string) (*ElectionResult, error) {
	// Check if election exists
	election, err := s.GetElection(ctx, electionID)
	if err != nil {
		return nil, err
	}

	// Check if election has ended
	if election.Status != "ended" {
		return nil, fmt.Errorf("election has not ended yet")
	}

	// Initialize result
	result := ElectionResult{
		ElectionID:       electionID,
		TotalVotes:       0,
		CandidateResults: []CandidateResult{},
	}

	// Initialize vote counts for each candidate
	candidateVotes := make(map[string]int)
	for _, candidateID := range election.Candidates {
		candidateVotes[candidateID] = 0
	}

	// Query all votes for this election
	voteIterator, err := ctx.GetStub().GetStateByPartialCompositeKey("VOTE_"+electionID, []string{})
	if err != nil {
		return nil, err
	}
	defer voteIterator.Close()

	// Count votes
	for voteIterator.HasNext() {
		queryResponse, err := voteIterator.Next()
		if err != nil {
			return nil, err
		}

		var vote Vote
		err = json.Unmarshal(queryResponse.Value, &vote)
		if err != nil {
			continue
		}

		candidateVotes[vote.CandidateID]++
		result.TotalVotes++
	}

	// Create candidate results
	for candidateID, voteCount := range candidateVotes {
		candidateResult := CandidateResult{
			CandidateID: candidateID,
			VoteCount:   voteCount,
		}
		result.CandidateResults = append(result.CandidateResults, candidateResult)
	}

	return &result, nil
}

func main() {
	chaincode, err := contractapi.NewChaincode(&VotingContract{})
	if err != nil {
		fmt.Printf("Error creating voting chaincode: %s", err.Error())
		return
	}

	if err := chaincode.Start(); err != nil {
		fmt.Printf("Error starting voting chaincode: %s", err.Error())
	}
}
