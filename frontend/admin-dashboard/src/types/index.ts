// Election types
export interface Election {
  electionId: string;
  name: string;
  startTime: string;
  endTime: string;
  status: 'CREATED' | 'UPCOMING' | 'ACTIVE' | 'ENDED' | 'CANCELLED';
  constituencies: string[];
  createdAt: string;
  updatedAt: string;
}

// Candidate types
export interface Candidate {
  candidateId: string;
  name: string;
  partyId: string;
  constituencyId: string;
  electionId: string;
  voteCount?: number;
  party: string;
  constituencyName: string;
  aadharHash: string;
  voterIdHash: string;
  createdAt: string;
  updatedAt: string;
}

// Polling Station types
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

// Constituency types
export interface Constituency {
  constituencyId: string;
  name: string;
  candidates: Candidate[];
}

// Election Results types
export interface ElectionResults {
  electionId: string;
  name: string;
  startTime: string;
  endTime: string;
  status: string;
  constituencies: ConstituencyResult[];
}

export interface ConstituencyResult {
  constituencyId: string;
  name: string;
  candidates: CandidateResult[];
}

export interface CandidateResult extends Candidate {
  voteCount: number;
}

// Voter types
export interface Voter {
  voterId: string;
  voterIdHash: string;
  aadharHash: string;
  constituencyId: string;
  eligibilityStatus: string;
  hasVoted: boolean;
  createdAt: string;
  updatedAt: string;
}

// Election Result types
export interface ElectionResult {
  constituencyId: string;
  constituencyName: string;
  totalVotes: number;
  candidates: {
    candidateId: string;
    name: string;
    party: string;
    votes: number;
    percentage: number;
  }[];
}

// User types
export interface User {
  id: string;
  username: string;
  role: 'ADMIN' | 'OFFICER';
  organization: 'StateElectionOffice' | 'DistrictElectionOffice';
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// Login Response types
export interface LoginResponse {
  token: string;
  user: {
    id: string;
    username: string;
    role: string;
  };
}

// Login Credentials types
export interface LoginCredentials {
  username: string;
  password: string;
}

// Form types
export interface ElectionFormData {
  name: string;
  startTime: string;
  endTime: string;
  constituencies: string[];
}

export interface CandidateFormData {
  name: string;
  partyId: string;
  constituencyId: string;
  electionId: string;
}

export interface PollingStationFormData {
  name: string;
  location: string;
  constituencyId: string;
}

export interface LoginFormData {
  username: string;
  password: string;
}
