import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  Paper
} from '@mui/material';
import {
  HowToVote as VoteIcon,
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useVoterAuth } from '../../contexts/VoterAuthContext';
import { electionsApi } from '../../services/api';
import { Election } from '../../types';
import GridItem from '../common/GridItem';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { voter, isAuthenticated } = useVoterAuth();
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchElections();
    }
  }, [isAuthenticated]);

  const fetchElections = async () => {
    try {
      setLoading(true);
      const response = await electionsApi.getAllElections();
      if (response.data.success) {
        setElections(response.data.data);
        setError(null);
      } else {
        setError(response.data.message || 'Failed to load elections');
      }
    } catch (err) {
      console.error('Failed to fetch elections:', err);
      setError('Failed to load elections. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (err) {
      return dateString;
    }
  };

  const isEligibleForElection = (election: Election) => {
    if (!voter) return false;
    return election.constituencies.includes(voter.votingDistrict);
  };

  const getElectionStatus = (election: Election) => {
    const status = election.status;
    
    if (status === 'UPCOMING') {
      return { status, label: 'Upcoming', color: 'info' as const };
    } else if (status === 'ACTIVE') {
      return { status, label: 'Active', color: 'success' as const };
    } else if (status === 'COMPLETED') {
      return { status, label: 'Completed', color: 'error' as const };
    } else {
      return { status, label: status, color: 'default' as const };
    }
  };

  const hasVotedInElection = (electionId: string) => {
    if (!voter) return false;
    return voter.votedElections && voter.votedElections.includes(electionId);
  };

  if (!isAuthenticated) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h5" gutterBottom>
          Please log in to view elections
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/login')}
          sx={{ mt: 2 }}
        >
          Go to Login
        </Button>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          Welcome, {voter?.name || `Voter ${voter?.voterId}`}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here are the active and upcoming elections you are eligible to vote in.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {elections.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'background.default' }}>
          <InfoIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No Elections Found
          </Typography>
          <Typography variant="body1" color="text.secondary">
            There are currently no elections available.
            Please check back later.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {elections.map((election) => {
            const { status, label, color } = getElectionStatus(election);
            const isEligible = isEligibleForElection(election);
            const hasVoted = hasVotedInElection(election.electionId);

            return (
              <GridItem xs={12} md={6} key={election.electionId}>
                <Card 
                  variant="outlined" 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    borderLeft: isEligible ? `4px solid ${color === 'success' ? '#4caf50' : '#2196f3'}` : undefined,
                    bgcolor: isEligible ? 'rgba(0, 0, 0, 0.02)' : undefined
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h6" component="h2">
                        {election.name}
                      </Typography>
                      <Chip label={label} color={color} size="small" />
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <CalendarIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        Start Date: {formatDate(election.startDate)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <CalendarIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        End Date: {formatDate(election.endDate)}
                      </Typography>
                    </Box>

                    <Divider sx={{ my: 1.5 }} />

                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <LocationIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        Constituencies: {election.constituencies.join(', ')}
                      </Typography>
                    </Box>

                    {hasVoted && (
                      <Alert severity="success" sx={{ mt: 2 }}>
                        You have already cast your vote in this election.
                      </Alert>
                    )}

                    {!isEligible && (
                      <Alert severity="info" sx={{ mt: 2 }}>
                        You are not eligible to vote in this election.
                      </Alert>
                    )}
                  </CardContent>
                  <CardActions sx={{ p: 2, pt: 0 }}>
                    <Button
                      size="small"
                      onClick={() => navigate(`/elections/${election.electionId}`)}
                    >
                      View Details
                    </Button>
                    {isEligible && status === 'ACTIVE' && !hasVoted && (
                      <Button
                        size="small"
                        variant="contained"
                        color="primary"
                        startIcon={<VoteIcon />}
                        onClick={() => navigate(`/vote/${election.electionId}`)}
                      >
                        Cast Vote
                      </Button>
                    )}
                  </CardActions>
                </Card>
              </GridItem>
            );
          })}
        </Grid>
      )}
    </Box>
  );
};

export default Home;
