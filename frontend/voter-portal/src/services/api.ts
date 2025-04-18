import axios from 'axios';
import { 
  Election, 
  Candidate, 
  ApiResponse,
  VoterVerificationResponse,
  VoteCastingResponse,
  VoterCredentials,
  VoteCastingRequest,
  Voter,
  ElectionResult
} from '../types';

// Create axios instance with base URL
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3003/api',
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('voter_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Health check API
export const healthApi = {
  check: () => api.get<ApiResponse<{ status: string }>>('/health'),
};

// Voter API
export const voterApi = {
  register: (voterData: { voterId: string, name: string, aadharId: string, votingDistrict: string }) => 
    api.post<ApiResponse<Voter>>('/voters/register', voterData),
  getVoterById: (voterId: string) => 
    api.get<ApiResponse<Voter>>(`/voters/${voterId}`),
  verify: (credentials: VoterCredentials) => 
    api.post<ApiResponse<VoterVerificationResponse>>('/voters/verify', credentials),
  logout: () => {
    localStorage.removeItem('voter_token');
    localStorage.removeItem('voter_info');
  },
};

// Elections API
export const electionsApi = {
  getAllElections: () => api.get<ApiResponse<Election[]>>('/elections'),
  getElectionById: (id: string) => api.get<ApiResponse<Election>>(`/elections/${id}`),
  getElectionResults: (id: string) => api.get<ApiResponse<ElectionResult[]>>(`/elections/${id}/results`),
};

// Candidates API
export const candidatesApi = {
  getByConstituency: (constituencyId: string) => 
    api.get<ApiResponse<Candidate[]>>(`/candidates/constituency/${constituencyId}`),
  getByElection: (electionId: string) => 
    api.get<ApiResponse<Candidate[]>>(`/candidates/election/${electionId}`),
};

// Voting API
export const votingApi = {
  castVote: (voteData: VoteCastingRequest) => 
    api.post<ApiResponse<VoteCastingResponse>>('/voting/cast', voteData),
};

export default api;
