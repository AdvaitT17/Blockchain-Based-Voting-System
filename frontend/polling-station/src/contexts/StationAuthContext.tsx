import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { stationAuthApi } from '../services/api';
import { PollingStation, StationCredentials } from '../types';

interface StationAuthContextType {
  isAuthenticated: boolean;
  station: PollingStation | null;
  loading: boolean;
  error: string | null;
  login: (credentials: StationCredentials) => Promise<boolean>;
  logout: () => void;
}

const StationAuthContext = createContext<StationAuthContextType | undefined>(undefined);

export const useStationAuth = () => {
  const context = useContext(StationAuthContext);
  if (!context) {
    throw new Error('useStationAuth must be used within a StationAuthProvider');
  }
  return context;
};

interface StationAuthProviderProps {
  children: ReactNode;
}

export const StationAuthProvider: React.FC<StationAuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [station, setStation] = useState<PollingStation | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if station is already authenticated
    const token = localStorage.getItem('station_token');
    const storedStation = localStorage.getItem('station_info');
    
    if (token && storedStation) {
      try {
        setStation(JSON.parse(storedStation));
        setIsAuthenticated(true);
      } catch (err) {
        console.error('Failed to parse stored station info:', err);
        localStorage.removeItem('station_token');
        localStorage.removeItem('station_info');
      }
    }
    
    setLoading(false);
  }, []);

  const login = async (credentials: StationCredentials): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await stationAuthApi.login(credentials);
      const { success, data, message } = response.data;
      
      if (success && data.valid && data.pollingStation && data.token) {
        localStorage.setItem('station_token', data.token);
        localStorage.setItem('station_info', JSON.stringify(data.pollingStation));
        setStation(data.pollingStation);
        setIsAuthenticated(true);
        return true;
      } else {
        setError(message || 'Authentication failed. Please check your credentials.');
        return false;
      }
    } catch (err: any) {
      console.error('Station authentication failed:', err);
      setError(err.response?.data?.message || 'Authentication failed. Please try again later.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    stationAuthApi.logout();
    setStation(null);
    setIsAuthenticated(false);
  };

  const value = {
    isAuthenticated,
    station,
    loading,
    error,
    login,
    logout
  };

  return (
    <StationAuthContext.Provider value={value}>
      {children}
    </StationAuthContext.Provider>
  );
};
