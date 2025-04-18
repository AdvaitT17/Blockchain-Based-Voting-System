import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { VoterAuthProvider } from './contexts/VoterAuthContext';

// Components
import Layout from './components/layout/Layout';
import Login from './components/auth/Login';
import Home from './components/voter/Home';
import ElectionDetails from './components/voter/ElectionDetails';
import VotingPage from './components/voting/VotingPage';

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

// App component
const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <VoterAuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route 
              path="/" 
              element={
                <Layout>
                  <Home />
                </Layout>
              } 
            />
            
            <Route 
              path="/elections/:id" 
              element={
                <Layout>
                  <ElectionDetails />
                </Layout>
              } 
            />
            
            <Route 
              path="/vote/:id" 
              element={
                <Layout>
                  <VotingPage />
                </Layout>
              } 
            />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </VoterAuthProvider>
    </ThemeProvider>
  );
};

export default App;
