import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  useMediaQuery,
  useTheme,
  Container,
  Chip
} from '@mui/material';
import { HowToVote as VoteIcon, ExitToApp as LogoutIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useVoterAuth } from '../../contexts/VoterAuthContext';

const Header: React.FC = () => {
  const { isAuthenticated, voter, logout } = useVoterAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavigateHome = () => {
    navigate('/');
  };

  return (
    <AppBar position="static" sx={{ backgroundColor: '#1a237e' }}>
      <Container maxWidth="lg">
        <Toolbar disableGutters>
          <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={handleNavigateHome}>
            <VoteIcon sx={{ mr: 1 }} />
            <Typography
              variant={isMobile ? 'h6' : 'h5'}
              component="div"
              sx={{ 
                flexGrow: 1, 
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              Blockchain Voting
              {!isMobile && (
                <Typography
                  variant="subtitle1"
                  component="span"
                  sx={{ ml: 1, fontWeight: 'normal', opacity: 0.8 }}
                >
                  Voter Portal
                </Typography>
              )}
            </Typography>
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          {isAuthenticated && voter ? (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {!isMobile && (
                <Box sx={{ mr: 2, textAlign: 'right' }}>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Voter ID: {voter.voterId}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Constituency: {voter.constituencyId}
                  </Typography>
                </Box>
              )}
              <Chip 
                label={voter.hasVoted ? "Already Voted" : "Not Voted Yet"} 
                color={voter.hasVoted ? "success" : "default"}
                size="small"
                sx={{ mr: 2 }}
              />
              <Button 
                color="inherit" 
                onClick={handleLogout}
                startIcon={<LogoutIcon />}
                size={isMobile ? "small" : "medium"}
              >
                {isMobile ? "Logout" : "Sign Out"}
              </Button>
            </Box>
          ) : (
            <Button 
              color="inherit" 
              onClick={() => navigate('/login')}
            >
              Login
            </Button>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header;
