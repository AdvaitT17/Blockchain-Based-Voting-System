import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Components
import Layout from './components/layout/Layout';
import Login from './components/auth/Login';
import Dashboard from './components/dashboard/Dashboard';
import ElectionsList from './components/elections/ElectionsList';
import CreateElectionForm from './components/elections/CreateElectionForm';
import ElectionDetails from './components/elections/ElectionDetails';
import CandidatesList from './components/candidates/CandidatesList';
import CreateCandidateForm from './components/candidates/CreateCandidateForm';
import ElectionResults from './components/results/ElectionResults';
import PollingStationsList from './components/polling-stations/PollingStationsList';
import CreatePollingStationForm from './components/polling-stations/CreatePollingStationForm';
import PollingStationDetails from './components/polling-stations/PollingStationDetails';

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1a237e',
    },
    secondary: {
      main: '#7e57c2',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});

// Protected route component
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  // In a real implementation, we would use the useAuth hook to check if the user is authenticated
  // For now, we'll check if there's a token in localStorage
  const isAuthenticated = localStorage.getItem('token') !== null;
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return <>{children}</>;
};

// App component
const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Layout title="Dashboard">
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/elections" 
              element={
                <ProtectedRoute>
                  <Layout title="Elections">
                    <ElectionsList />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/elections/create" 
              element={
                <ProtectedRoute>
                  <Layout title="Create Election">
                    <CreateElectionForm />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/elections/:id" 
              element={
                <ProtectedRoute>
                  <Layout title="Election Details">
                    <ElectionDetails />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/candidates" 
              element={
                <ProtectedRoute>
                  <Layout title="Candidates">
                    <CandidatesList />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/candidates/create" 
              element={
                <ProtectedRoute>
                  <Layout title="Register Candidate">
                    <CreateCandidateForm />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/results/:id" 
              element={
                <ProtectedRoute>
                  <Layout title="Election Results">
                    <ElectionResults />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/results" 
              element={
                <ProtectedRoute>
                  <Layout title="Election Results">
                    <ElectionsList />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/polling-stations" 
              element={
                <ProtectedRoute>
                  <Layout title="Polling Stations">
                    <PollingStationsList />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/polling-stations/create" 
              element={
                <ProtectedRoute>
                  <Layout title="Add Polling Station">
                    <CreatePollingStationForm />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/polling-stations/edit/:id" 
              element={
                <ProtectedRoute>
                  <Layout title="Edit Polling Station">
                    <CreatePollingStationForm />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/polling-stations/:id" 
              element={
                <ProtectedRoute>
                  <Layout title="Polling Station Details">
                    <PollingStationDetails />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
