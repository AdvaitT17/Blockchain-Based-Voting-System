import axios from 'axios';
import { 
  Election, 
  Candidate, 
  PollingStation, 
  ApiResponse,
  LoginResponse,
  LoginCredentials
} from '../types';

// Create axios instance with base URL
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Authentication API
export const authApi = {
  login: (credentials: LoginCredentials) => 
    api.post<ApiResponse<LoginResponse>>('/auth/login', credentials),
  logout: () => api.post<ApiResponse<null>>('/auth/logout'),
  verifyToken: () => api.get<ApiResponse<{ valid: boolean }>>('/auth/verify'),
};

// Elections API
export const electionsApi = {
  getAll: () => api.get<ApiResponse<Election[]>>('/elections'),
  getById: (id: string) => api.get<ApiResponse<Election>>(`/elections/${id}`),
  create: (election: Partial<Election>) => api.post<ApiResponse<Election>>('/elections', election),
  update: (id: string, election: Partial<Election>) => api.put<ApiResponse<Election>>(`/elections/${id}`, election),
  delete: (id: string) => api.delete<ApiResponse<null>>(`/elections/${id}`),
  getResults: (id: string) => api.get<ApiResponse<any>>(`/elections/${id}/results`),
  startElection: (id: string) => api.post<ApiResponse<Election>>(`/elections/${id}/start`),
  endElection: (id: string) => api.post<ApiResponse<Election>>(`/elections/${id}/end`),
  cancelElection: (id: string) => api.post<ApiResponse<Election>>(`/elections/${id}/cancel`),
};

// Candidates API
export const candidatesApi = {
  getAll: () => api.get<ApiResponse<Candidate[]>>('/candidates'),
  getById: (id: string) => api.get<ApiResponse<Candidate>>(`/candidates/${id}`),
  getByElection: (electionId: string) => api.get<ApiResponse<Candidate[]>>(`/candidates/election/${electionId}`),
  create: (candidate: Partial<Candidate>) => api.post<ApiResponse<Candidate>>('/candidates', candidate),
  update: (id: string, candidate: Partial<Candidate>) => api.put<ApiResponse<Candidate>>(`/candidates/${id}`, candidate),
  delete: (id: string) => api.delete<ApiResponse<null>>(`/candidates/${id}`),
};

// Polling Stations API
export const pollingStationsApi = {
  getAll: () => api.get<ApiResponse<PollingStation[]>>('/polling-stations'),
  getById: (id: string) => api.get<ApiResponse<PollingStation>>(`/polling-stations/${id}`),
  getByConstituency: (constituencyId: string) => api.get<ApiResponse<PollingStation[]>>(`/polling-stations/constituency/${constituencyId}`),
  create: (station: Partial<PollingStation>) => api.post<ApiResponse<PollingStation>>('/polling-stations', station),
  update: (id: string, station: Partial<PollingStation>) => api.put<ApiResponse<PollingStation>>(`/polling-stations/${id}`, station),
  delete: (id: string) => api.delete<ApiResponse<null>>(`/polling-stations/${id}`),
  activate: (id: string) => api.post<ApiResponse<PollingStation>>(`/polling-stations/${id}/activate`),
  deactivate: (id: string) => api.post<ApiResponse<PollingStation>>(`/polling-stations/${id}/deactivate`),
};

// Voters API
export const votersApi = {
  verifyVoter: (voterId: string, aadhar: string) => 
    api.post<ApiResponse<{ valid: boolean }>>('/voters/verify', { voterId, aadhar }),
  getVoterStatus: (voterId: string) => 
    api.get<ApiResponse<{ hasVoted: boolean }>>(`/voters/${voterId}/status`),
};

export default api;
