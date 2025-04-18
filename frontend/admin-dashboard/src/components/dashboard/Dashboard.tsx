import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid as MuiGrid,
  Paper,
  Typography,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip,
  Button,
  CircularProgress
} from '@mui/material';
import {
  HowToVote as ElectionIcon,
  People as CandidateIcon,
  LocationOn as PollingStationIcon,
  Assessment as ResultsIcon,
  ArrowForward as ArrowIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { electionsApi } from '../../services/api';
import { Election } from '../../types';
import { format } from 'date-fns';

// Create a Grid component that properly handles the 'item' prop
const Grid = (props: any) => <MuiGrid {...props} />;

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalElections: 0,
    activeElections: 0,
    upcomingElections: 0,
    endedElections: 0,
    totalCandidates: 0,
    totalPollingStations: 0
  });

  useEffect(() => {
    fetchElections();
  }, []);

  const fetchElections = async () => {
    try {
      setLoading(true);
      const response = await electionsApi.getAll();
      const electionData = response.data.data;
      setElections(electionData);
      
      // Calculate stats
      const active = electionData.filter((e: Election) => e.status === 'ACTIVE').length;
      const upcoming = electionData.filter((e: Election) => e.status === 'UPCOMING').length;
      const ended = electionData.filter((e: Election) => e.status === 'ENDED').length;
      
      // For now, we'll use mock data for candidates and polling stations
      // In a real implementation, we would fetch this data from the API
      setStats({
        totalElections: electionData.length,
        activeElections: active,
        upcomingElections: upcoming,
        endedElections: ended,
        totalCandidates: 45, // Mock data
        totalPollingStations: 20 // Mock data
      });
      
      setError(null);
    } catch (err) {
      console.error('Failed to fetch elections:', err);
      setError('Failed to load dashboard data. Please try again later.');
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

  const getStatusChip = (status: string) => {
    let color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' = 'default';
    
    switch (status) {
      case 'CREATED':
        color = 'default';
        break;
      case 'UPCOMING':
        color = 'info';
        break;
      case 'ACTIVE':
        color = 'success';
        break;
      case 'ENDED':
        color = 'secondary';
        break;
      case 'CANCELLED':
        color = 'error';
        break;
    }
    
    return <Chip label={status} color={color} size="small" />;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" component="h1" gutterBottom>
        Dashboard
      </Typography>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
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
              <ElectionIcon sx={{ fontSize: 60 }} />
            </Box>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Total Elections
            </Typography>
            <Typography component="p" variant="h3">
              {stats.totalElections}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              {stats.activeElections} active • {stats.upcomingElections} upcoming
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
              <CandidateIcon sx={{ fontSize: 60 }} />
            </Box>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Candidates
            </Typography>
            <Typography component="p" variant="h3">
              {stats.totalCandidates}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Registered across all elections
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
              <PollingStationIcon sx={{ fontSize: 60 }} />
            </Box>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Polling Stations
            </Typography>
            <Typography component="p" variant="h3">
              {stats.totalPollingStations}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Active polling stations
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
              <ResultsIcon sx={{ fontSize: 60 }} />
            </Box>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Completed Elections
            </Typography>
            <Typography component="p" variant="h3">
              {stats.endedElections}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Elections with results available
            </Typography>
          </Paper>
        </Grid>

        {/* Active Elections */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Active & Upcoming Elections
              </Typography>
              <Button 
                endIcon={<ArrowIcon />} 
                onClick={() => navigate('/elections')}
                size="small"
              >
                View All
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            {elections.filter(e => e.status === 'ACTIVE' || e.status === 'UPCOMING').length > 0 ? (
              <List>
                {elections
                  .filter(e => e.status === 'ACTIVE' || e.status === 'UPCOMING')
                  .sort((a, b) => {
                    // Sort by status (ACTIVE first) and then by start time
                    if (a.status === 'ACTIVE' && b.status !== 'ACTIVE') return -1;
                    if (a.status !== 'ACTIVE' && b.status === 'ACTIVE') return 1;
                    return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
                  })
                  .slice(0, 5) // Show only the first 5
                  .map((election) => (
                    <ListItem 
                      key={election.electionId}
                      sx={{ 
                        borderLeft: election.status === 'ACTIVE' ? '4px solid #4caf50' : '4px solid #2196f3',
                        pl: 2,
                        mb: 1,
                        backgroundColor: 'rgba(0, 0, 0, 0.02)',
                        borderRadius: 1
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="subtitle1">{election.name}</Typography>
                            {getStatusChip(election.status)}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" component="span">
                              {election.status === 'ACTIVE' 
                                ? `Started: ${formatDate(election.startTime)} • Ends: ${formatDate(election.endTime)}`
                                : `Starts: ${formatDate(election.startTime)} • Ends: ${formatDate(election.endTime)}`
                              }
                            </Typography>
                            <Typography variant="body2" component="div">
                              Constituencies: {election.constituencies.length}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))
                }
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                No active or upcoming elections. Create a new election to get started.
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={<ElectionIcon />}
                  onClick={() => navigate('/elections/create')}
                  sx={{ mb: 2 }}
                >
                  Create New Election
                </Button>
              </Grid>
              
              <Grid item xs={12}>
                <Button
                  fullWidth
                  variant="outlined"
                  color="primary"
                  size="large"
                  startIcon={<CandidateIcon />}
                  onClick={() => navigate('/candidates/create')}
                  sx={{ mb: 2 }}
                >
                  Register Candidate
                </Button>
              </Grid>
              
              <Grid item xs={12}>
                <Button
                  fullWidth
                  variant="outlined"
                  color="primary"
                  size="large"
                  startIcon={<PollingStationIcon />}
                  onClick={() => navigate('/polling-stations/create')}
                  sx={{ mb: 2 }}
                >
                  Add Polling Station
                </Button>
              </Grid>
              
              <Grid item xs={12}>
                <Button
                  fullWidth
                  variant="outlined"
                  color="primary"
                  size="large"
                  startIcon={<ResultsIcon />}
                  onClick={() => navigate('/results')}
                >
                  View Results
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Recent Results */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Recent Election Results
              </Typography>
              <Button 
                endIcon={<ArrowIcon />} 
                onClick={() => navigate('/results')}
                size="small"
              >
                View All
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            {elections.filter(e => e.status === 'ENDED').length > 0 ? (
              <Grid container spacing={2}>
                {elections
                  .filter(e => e.status === 'ENDED')
                  .sort((a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime())
                  .slice(0, 3) // Show only the first 3
                  .map((election) => (
                    <Grid item xs={12} md={4} key={election.electionId}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            {election.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Ended: {formatDate(election.endTime)}
                          </Typography>
                          <Typography variant="body2" gutterBottom>
                            Constituencies: {election.constituencies.length}
                          </Typography>
                          <Button
                            variant="text"
                            color="primary"
                            onClick={() => navigate(`/results/${election.electionId}`)}
                            sx={{ mt: 1 }}
                          >
                            View Results
                          </Button>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))
                }
              </Grid>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                No completed elections yet. Results will appear here when elections end.
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
