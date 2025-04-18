import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { voterApi } from '../services/api';
import { Voter, VoterCredentials } from '../types';

interface VoterAuthContextType {
  isAuthenticated: boolean;
  voter: Voter | null;
  loading: boolean;
  error: string | null;
  verifyVoter: (credentials: VoterCredentials) => Promise<boolean>;
  registerVoter: (voterData: { voterId: string, name: string, aadharId: string, votingDistrict: string }) => Promise<boolean>;
  logout: () => void;
}

const VoterAuthContext = createContext<VoterAuthContextType | undefined>(undefined);

export const useVoterAuth = () => {
  const context = useContext(VoterAuthContext);
  if (!context) {
    throw new Error('useVoterAuth must be used within a VoterAuthProvider');
  }
  return context;
};

interface VoterAuthProviderProps {
  children: ReactNode;
}

export const VoterAuthProvider: React.FC<VoterAuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [voter, setVoter] = useState<Voter | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is already authenticated
    const token = localStorage.getItem('voter_token');
    const storedVoter = localStorage.getItem('voter_info');
    
    if (token && storedVoter) {
      try {
        setVoter(JSON.parse(storedVoter));
        setIsAuthenticated(true);
      } catch (err) {
        console.error('Failed to parse stored voter info:', err);
        localStorage.removeItem('voter_token');
        localStorage.removeItem('voter_info');
      }
    }
    
    setLoading(false);
  }, []);

  const verifyVoter = async (credentials: VoterCredentials): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await voterApi.verify(credentials);
      const { success, data, message } = response.data;
      
      if (success && data.valid && data.voter && data.token) {
        localStorage.setItem('voter_token', data.token);
        localStorage.setItem('voter_info', JSON.stringify(data.voter));
        setVoter(data.voter);
        setIsAuthenticated(true);
        return true;
      } else {
        setError(message || 'Verification failed. Please check your credentials.');
        return false;
      }
    } catch (err: any) {
      console.error('Voter verification failed:', err);
      setError(err.response?.data?.message || 'Verification failed. Please try again later.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const registerVoter = async (voterData: { voterId: string, name: string, aadharId: string, votingDistrict: string }): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await voterApi.register(voterData);
      const { success, data, message } = response.data;
      
      if (success && data) {
        // After registration, we don't automatically log in the user
        // They need to verify their credentials first
        return true;
      } else {
        setError(message || 'Registration failed. Please try again.');
        return false;
      }
    } catch (err: any) {
      console.error('Voter registration failed:', err);
      setError(err.response?.data?.message || 'Registration failed. Please try again later.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    voterApi.logout();
    setVoter(null);
    setIsAuthenticated(false);
  };

  const value = {
    isAuthenticated,
    voter,
    loading,
    error,
    verifyVoter,
    registerVoter,
    logout
  };

  return (
    <VoterAuthContext.Provider value={value}>
      {children}
    </VoterAuthContext.Provider>
  );
};
