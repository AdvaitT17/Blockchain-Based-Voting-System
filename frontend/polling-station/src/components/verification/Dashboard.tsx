import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid as MuiGrid,
  Card,
  CardContent,
  Button,
  Divider,
  Alert,
  CircularProgress,
  Paper
} from '@mui/material';
import {
  HowToVote as VoteIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  Assessment as StatsIcon
} from '@mui/icons-material';
import { useStationAuth } from '../../contexts/StationAuthContext';
import { electionsApi, votingApi } from '../../services/api';
import { Election, VotingStats } from '../../types';
import { format } from 'date-fns';

// Create a Grid component that properly handles the 'item' prop
const Grid = (props: any) => <MuiGrid {...props} />;

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { station, isAuthenticated } = useStationAuth();
  const [activeElections, setActiveElections] = useState<Election[]>([]);
  const [stats, setStats] = useState<VotingStats>({
    totalVoters: 0,
    votedCount: 0,
    pendingCount: 0,
    verificationCount: 0,
    rejectionCount: 0,
    percentageVoted: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && station) {
      fetchActiveElections();
      fetchStationStats();
    }
  }, [isAuthenticated, station]);

  const fetchActiveElections = async () => {
    try {
      setLoading(true);
      const response = await electionsApi.getActiveElections();
      const elections = response.data.data;
      
      // Filter elections for this polling station's constituency
      if (station) {
        const filteredElections = elections.filter(
          (election: Election) => election.constituencies.includes(station.constituencyId)
        );
        setActiveElections(filteredElections);
      } else {
        setActiveElections([]);
      }
      
      setError(null);
    } catch (err) {
      console.error('Failed to fetch active elections:', err);
      setError('Failed to load active elections. Please try again later.');
    }
  };

  const fetchStationStats = async () => {
    try {
      if (!station) return;
      
      const response = await votingApi.getStationStats(station.stationId);
      setStats(response.data.data.stats);
    } catch (err) {
      console.error('Failed to fetch station stats:', err);
      // Don't set error here to avoid multiple error messages
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch (err) {
      return dateString;
    }
  };

  if (!isAuthenticated) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h5" gutterBottom>
          Please log in to access the polling station interface
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

  if (!station) {
    return (
      <Alert severity="error">
        Polling station information not available. Please try logging in again.
      </Alert>
    );
  }

  if (station.status !== 'ACTIVE') {
    return (
      <Box>
        <Alert severity="warning" sx={{ mb: 3 }}>
          This polling station is currently inactive. Please contact the election commission to activate it.
        </Alert>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Polling Station Information
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="body1" gutterBottom>
            <strong>Station ID:</strong> {station.stationId}
          </Typography>
          <Typography variant="body1" gutterBottom>
            <strong>Name:</strong> {station.name}
          </Typography>
          <Typography variant="body1" gutterBottom>
            <strong>Location:</strong> {station.location}
          </Typography>
          <Typography variant="body1" gutterBottom>
            <strong>Constituency:</strong> {station.constituencyName}
          </Typography>
          <Typography variant="body1">
            <strong>Status:</strong> Inactive
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          Polling Station Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Welcome to {station.name} ({station.stationId}). Manage voter verification and voting process here.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} md={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              backgroundColor: '#e3f2fd',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <Box sx={{ position: 'absolute', top: 10, right: 10, opacity: 0.2 }}>
              <PersonIcon sx={{ fontSize: 60 }} />
            </Box>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Total Voters
            </Typography>
            <Typography component="p" variant="h3">
              {stats.totalVoters}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              {stats.votedCount} voted • {stats.pendingCount} pending
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              backgroundColor: '#e8f5e9',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <Box sx={{ position: 'absolute', top: 10, right: 10, opacity: 0.2 }}>
              <VoteIcon sx={{ fontSize: 60 }} />
            </Box>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Votes Cast
            </Typography>
            <Typography component="p" variant="h3">
              {stats.votedCount}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              {stats.percentageVoted.toFixed(1)}% of registered voters
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              backgroundColor: '#fff8e1',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <Box sx={{ position: 'absolute', top: 10, right: 10, opacity: 0.2 }}>
              <PersonIcon sx={{ fontSize: 60 }} />
            </Box>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Verifications
            </Typography>
            <Typography component="p" variant="h3">
              {stats.verificationCount}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              {stats.rejectionCount} rejections
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              backgroundColor: '#f3e5f5',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <Box sx={{ position: 'absolute', top: 10, right: 10, opacity: 0.2 }}>
              <LocationIcon sx={{ fontSize: 60 }} />
            </Box>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Constituency
            </Typography>
            <Typography component="p" variant="subtitle1" sx={{ mt: 1 }}>
              {station.constituencyName}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              {activeElections.length} active elections
            </Typography>
          </Paper>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={<PersonIcon />}
                  onClick={() => navigate('/verify-voter')}
                  sx={{ py: 2 }}
                >
                  Verify Voter & Cast Vote
                </Button>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  color="primary"
                  size="large"
                  startIcon={<StatsIcon />}
                  onClick={() => navigate('/statistics')}
                  sx={{ py: 2 }}
                >
                  View Detailed Statistics
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Active Elections */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Active Elections
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            {activeElections.length > 0 ? (
              <Grid container spacing={2}>
                {activeElections.map((election) => (
                  <Grid item xs={12} md={6} key={election.electionId}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {election.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          <strong>Start Time:</strong> {formatDate(election.startTime)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          <strong>End Time:</strong> {formatDate(election.endTime)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Status:</strong> {election.status}
                        </Typography>
                        <Button
                          variant="text"
                          color="primary"
                          onClick={() => navigate(`/elections/${election.electionId}`)}
                          sx={{ mt: 2 }}
                        >
                          View Details
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Alert severity="info">
                No active elections for your constituency at the moment.
              </Alert>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
