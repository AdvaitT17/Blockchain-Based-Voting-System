import axios from 'axios';
import { 
  Election, 
  Candidate, 
  ApiResponse,
  StationAuthResponse,
  VoterVerificationResponse,
  VoteCastingResponse,
  StationCredentials,
  VoterVerificationRequest,
  VoteCastingRequest
} from '../types';

// Create axios instance with base URL
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3002/api',
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('station_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Polling Station Authentication API
export const stationAuthApi = {
  login: (credentials: StationCredentials) => 
    api.post<ApiResponse<StationAuthResponse>>('/polling-stations/auth', credentials),
  logout: () => {
    localStorage.removeItem('station_token');
    localStorage.removeItem('station_info');
  },
  verifyToken: () => api.get<ApiResponse<{ valid: boolean }>>('/polling-stations/verify-token'),
};

// Elections API
export const electionsApi = {
  getActiveElections: () => api.get<ApiResponse<Election[]>>('/elections/active'),
  getElectionById: (id: string) => api.get<ApiResponse<Election>>(`/elections/${id}`),
};

// Candidates API
export const candidatesApi = {
  getByElection: (electionId: string) => api.get<ApiResponse<Candidate[]>>(`/candidates/election/${electionId}`),
  getByConstituency: (constituencyId: string) => api.get<ApiResponse<Candidate[]>>(`/candidates/constituency/${constituencyId}`),
};

// Voter Verification API
export const voterApi = {
  verifyVoter: (verificationData: VoterVerificationRequest) => 
    api.post<ApiResponse<VoterVerificationResponse>>('/voters/verify', verificationData),
  getVoterStatus: (voterId: string) => 
    api.get<ApiResponse<{ hasVoted: boolean }>>(`/voters/${voterId}/status`),
};

// Voting API
export const votingApi = {
  castVote: (voteData: VoteCastingRequest) => 
    api.post<ApiResponse<VoteCastingResponse>>('/voting/cast', voteData),
  getStationStats: (stationId: string) => 
    api.get<ApiResponse<{ stats: any }>>(`/polling-stations/${stationId}/stats`),
};

export default api;
