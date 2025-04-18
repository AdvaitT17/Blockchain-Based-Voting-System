import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Container, Box } from '@mui/material';

// Context Providers
import { StationAuthProvider } from './contexts/StationAuthContext';

// Layout Components
import Layout from './components/layout/Layout';

// Auth Components
import Login from './components/auth/Login';

// Verification Components
import Dashboard from './components/verification/Dashboard';
import VoterVerification from './components/verification/VoterVerification';
import Statistics from './components/verification/Statistics';

// Voting Components
import VotingInterface from './components/voting/VotingInterface';

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  // Check if user is authenticated (this would use the auth context in a real app)
  const isAuthenticated = localStorage.getItem('pollingStation_token') !== null;
  
  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: [
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <StationAuthProvider>
        <Router>
          <Layout>
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
              <Box sx={{ py: 2 }}>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/login" element={<Login />} />
                  
                  {/* Protected Routes */}
                  <Route path="/" element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/verify-voter" element={
                    <ProtectedRoute>
                      <VoterVerification />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/statistics" element={
                    <ProtectedRoute>
                      <Statistics />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/voting/:electionId/:voterId" element={
                    <ProtectedRoute>
                      <VotingInterface />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/elections/:electionId" element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } />
                  
                  {/* Redirect to dashboard if logged in, otherwise to login */}
                  <Route path="*" element={
                    localStorage.getItem('pollingStation_token') ? 
                      <Navigate to="/" replace /> : 
                      <Navigate to="/login" replace />
                  } />
                </Routes>
              </Box>
            </Container>
          </Layout>
        </Router>
      </StationAuthProvider>
    </ThemeProvider>
  );
}

export default App;
