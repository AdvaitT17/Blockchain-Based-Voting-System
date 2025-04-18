export interface Election {
  electionId: string;
  name: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  status: string;
  constituencies: string[];
  candidates: Candidate[];
}

export interface Candidate {
  candidateId: string;
  name: string;
  party: string;
  constituencyId: string;
  electionId?: string;
  constituencyName?: string;
}

export interface PollingStation {
  stationId: string;
  name: string;
  location: string;
  constituencyId: string;
  constituencyName: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Voter {
  voterId: string;
  name: string;
  aadharId: string;
  votingDistrict: string;
  constituencyId?: string;
  registrationDate: string;
  status: string;
  votedElections: string[];
  hasVoted?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface VoterVerificationResponse {
  valid: boolean;
  voter?: Voter;
  token?: string;
}

export interface VoteCastingResponse {
  voteId: string;
  electionId: string;
  candidateId: string;
  timestamp: string;
}

export interface VoterCredentials {
  voterId: string;
  aadharNumber: string;
}

export interface VoteCastingRequest {
  electionId: string;
  candidateId: string;
  voterId: string;
  pollingStationId?: string;
}

export interface Constituency {
  id: string;
  name: string;
}

export interface ElectionResult {
  candidate: Candidate;
  voteCount: number;
}
