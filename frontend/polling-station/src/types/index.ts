export interface Election {
  electionId: string;
  name: string;
  startTime: string;
  endTime: string;
  status: string;
  constituencies: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Candidate {
  candidateId: string;
  name: string;
  party: string;
  electionId: string;
  constituencyId: string;
  constituencyName: string;
  aadharHash: string;
  voterIdHash: string;
  createdAt: string;
  updatedAt: string;
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
  voterIdHash: string;
  aadharHash: string;
  constituencyId: string;
  eligibilityStatus: string;
  hasVoted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface StationAuthResponse {
  valid: boolean;
  pollingStation?: PollingStation;
  token?: string;
}

export interface VoterVerificationResponse {
  valid: boolean;
  voter?: Voter;
}

export interface VoteCastingResponse {
  success: boolean;
  message: string;
  transactionId?: string;
}

export interface StationCredentials {
  stationId: string;
  password: string;
}

export interface VoterVerificationRequest {
  voterId: string;
  aadharNumber: string;
}

export interface VoteCastingRequest {
  electionId: string;
  candidateId: string;
  voterId: string;
  pollingStationId: string;
}

export interface VotingStats {
  totalVoters: number;
  votedCount: number;
  pendingCount: number;
  verificationCount: number;
  rejectionCount: number;
  percentageVoted: number;
}
