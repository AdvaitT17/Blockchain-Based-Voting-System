import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid as MuiGrid,
  Alert,
  CircularProgress,
  Divider,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Assessment as StatsIcon,
  HowToVote as VoteIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';
import { useStationAuth } from '../../contexts/StationAuthContext';
import { votingApi, electionsApi } from '../../services/api';
import { VotingStats, Election } from '../../types';
import { format } from 'date-fns';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  ChartData
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Create a Grid component that properly handles the 'item' prop
const Grid = (props: any) => <MuiGrid {...props} />;

// Define chart data types
interface ChartDataset {
  label?: string;
  data: number[];
  backgroundColor: string[];
  borderColor?: string[];
  borderWidth?: number;
}

const Statistics: React.FC = () => {
  const navigate = useNavigate();
  const { station, isAuthenticated } = useStationAuth();
  const [stats, setStats] = useState<VotingStats>({
    totalVoters: 0,
    votedCount: 0,
    pendingCount: 0,
    verificationCount: 0,
    rejectionCount: 0,
    percentageVoted: 0
  });
  const [elections, setElections] = useState<Election[]>([]);
  const [hourlyStats, setHourlyStats] = useState<{ hour: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && station) {
      fetchStationStats();
      fetchActiveElections();
      fetchHourlyStats();
    }
  }, [isAuthenticated, station]);

  const fetchStationStats = async () => {
    try {
      if (!station) return;
      
      const response = await votingApi.getStationStats(station.stationId);
      setStats(response.data.data.stats);
    } catch (err) {
      console.error('Failed to fetch station stats:', err);
      setError('Failed to load station statistics. Please try again later.');
    }
  };

  const fetchActiveElections = async () => {
    try {
      const response = await electionsApi.getActiveElections();
      const allElections = response.data.data;
      
      // Filter elections for this polling station's constituency
      if (station) {
        const filteredElections = allElections.filter(
          (election: Election) => election.constituencies.includes(station.constituencyId)
        );
        setElections(filteredElections);
      }
    } catch (err) {
      console.error('Failed to fetch active elections:', err);
      // Don't set error here to avoid multiple error messages
    }
  };

  const fetchHourlyStats = async () => {
    try {
      // In a real implementation, we would fetch hourly stats from the API
      // For now, we'll use mock data
      const mockHourlyStats = [
        { hour: '08:00', count: 12 },
        { hour: '09:00', count: 25 },
        { hour: '10:00', count: 38 },
        { hour: '11:00', count: 29 },
        { hour: '12:00', count: 18 },
        { hour: '13:00', count: 15 },
        { hour: '14:00', count: 22 },
        { hour: '15:00', count: 31 },
        { hour: '16:00', count: 27 },
        { hour: '17:00', count: 19 }
      ];
      
      setHourlyStats(mockHourlyStats);
    } catch (err) {
      console.error('Failed to fetch hourly stats:', err);
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

  const getVotingProgressChartData = (): ChartData<'bar'> => {
    return {
      labels: hourlyStats.map(stat => stat.hour),
      datasets: [
        {
          label: 'Votes Cast',
          data: hourlyStats.map(stat => stat.count),
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }
      ]
    };
  };

  const getVotingDistributionChartData = (): ChartData<'pie'> => {
    return {
      labels: ['Voted', 'Pending'],
      datasets: [
        {
          data: [stats.votedCount, stats.pendingCount],
          backgroundColor: [
            'rgba(75, 192, 192, 0.6)',
            'rgba(255, 206, 86, 0.6)'
          ],
          borderColor: [
            'rgba(75, 192, 192, 1)',
            'rgba(255, 206, 86, 1)'
          ],
          borderWidth: 1
        }
      ]
    };
  };

  if (!isAuthenticated) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h5" gutterBottom>
          Please log in to view statistics
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

  return (
    <Box>
      <Button
        startIcon={<BackIcon />}
        onClick={() => navigate('/')}
        sx={{ mb: 3 }}
      >
        Back to Dashboard
      </Button>

      <Typography variant="h5" component="h1" gutterBottom>
        Polling Station Statistics
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Real-time voting statistics for {station.name} ({station.stationId})
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Summary Cards */}
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
              Registered in this constituency
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
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Box sx={{ width: '100%', mr: 1 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={stats.percentageVoted} 
                  color="success"
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
              <Box sx={{ minWidth: 35 }}>
                <Typography variant="body2" color="text.secondary">
                  {stats.percentageVoted.toFixed(1)}%
                </Typography>
              </Box>
            </Box>
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
              Pending Votes
            </Typography>
            <Typography component="p" variant="h3">
              {stats.pendingCount}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Eligible voters yet to vote
            </Typography>
          </Paper>
        </Grid>

        {/* Voting Progress Chart */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Hourly Voting Progress
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Box sx={{ height: 300 }}>
              <Bar
                data={getVotingProgressChartData()}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    title: {
                      display: true,
                      text: 'Votes Cast by Hour'
                    },
                    legend: {
                      display: false
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'Number of Votes'
                      }
                    },
                    x: {
                      title: {
                        display: true,
                        text: 'Hour of Day'
                      }
                    }
                  }
                }}
              />
            </Box>
          </Paper>
        </Grid>

        {/* Voting Distribution Chart */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Voting Distribution
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Box sx={{ height: 300 }}>
              <Pie
                data={getVotingDistributionChartData()}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    title: {
                      display: true,
                      text: 'Voter Participation'
                    }
                  }
                }}
              />
            </Box>
          </Paper>
        </Grid>

        {/* Active Elections */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Active Elections
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Election Name</TableCell>
                    <TableCell>Start Time</TableCell>
                    <TableCell>End Time</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Votes Cast</TableCell>
                    <TableCell>Participation Rate</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {elections.length > 0 ? (
                    elections.map((election) => (
                      <TableRow key={election.electionId}>
                        <TableCell>{election.name}</TableCell>
                        <TableCell>{formatDate(election.startTime)}</TableCell>
                        <TableCell>{formatDate(election.endTime)}</TableCell>
                        <TableCell>{election.status}</TableCell>
                        <TableCell>{stats.votedCount}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box sx={{ width: '100%', mr: 1 }}>
                              <LinearProgress 
                                variant="determinate" 
                                value={stats.percentageVoted} 
                                color="success"
                                sx={{ height: 8, borderRadius: 4 }}
                              />
                            </Box>
                            <Box sx={{ minWidth: 35 }}>
                              <Typography variant="body2" color="text.secondary">
                                {stats.percentageVoted.toFixed(1)}%
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No active elections for this constituency
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Statistics;
