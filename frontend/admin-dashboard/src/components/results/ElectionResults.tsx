import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid as MuiGrid,
  Button,
  Divider,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Card,
  CardContent,
  LinearProgress,
  Chip
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { electionsApi } from '../../services/api';
import { ElectionResults, ConstituencyResult, CandidateResult } from '../../types';
import { format } from 'date-fns';
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
import { Bar, Pie, Doughnut } from 'react-chartjs-2';

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

interface ChartDataset {
  label?: string;
  data: number[];
  backgroundColor: string[];
  borderColor: string[];
  borderWidth: number;
}

interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

// Create a Grid component that properly handles the 'item' prop
const Grid = (props: any) => <MuiGrid {...props} />;

const ElectionResultsView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [results, setResults] = useState<ElectionResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    if (id) {
      fetchElectionResults(id);
    }
  }, [id]);

  const fetchElectionResults = async (electionId: string) => {
    try {
      setLoading(true);
      const response = await electionsApi.getResults(electionId);
      setResults(response.data.data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch election results:', err);
      setError('Failed to load election results. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
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
    
    return <Chip label={status} color={color} />;
  };

  const generateChartData = (constituency: ConstituencyResult): ChartData<'doughnut'> => {
    const labels = constituency.candidates.map(candidate => candidate.name);
    const data = constituency.candidates.map(candidate => candidate.voteCount);
    const backgroundColor = [
      'rgba(255, 99, 132, 0.6)',
      'rgba(54, 162, 235, 0.6)',
      'rgba(255, 206, 86, 0.6)',
      'rgba(75, 192, 192, 0.6)',
      'rgba(153, 102, 255, 0.6)',
      'rgba(255, 159, 64, 0.6)',
      'rgba(199, 199, 199, 0.6)',
      'rgba(83, 102, 255, 0.6)',
      'rgba(40, 159, 64, 0.6)',
      'rgba(210, 199, 199, 0.6)',
    ];

    return {
      labels,
      datasets: [
        {
          label: 'Votes',
          data,
          backgroundColor,
          borderColor: backgroundColor.map(color => color.replace('0.6', '1')),
          borderWidth: 1,
        },
      ],
    };
  };

  const generateOverallChartData = (): ChartData<'bar'> => {
    if (!results) return { labels: [], datasets: [] };

    const constituencyNames = results.constituencies.map(c => c.name);
    const datasets: ChartDataset[] = [];
    
    // Get unique parties from all candidates
    const allCandidates = results.constituencies.flatMap(c => c.candidates);
    const uniqueParties = [...new Set(allCandidates.map(c => c.partyId))];
    
    // Create a dataset for each party
    uniqueParties.forEach((party, index) => {
      const partyData = results.constituencies.map(constituency => {
        const partyCandidates = constituency.candidates.filter(c => c.partyId === party);
        return partyCandidates.reduce((sum, candidate) => sum + candidate.voteCount, 0);
      });
      
      const backgroundColor = [
        'rgba(255, 99, 132, 0.6)',
        'rgba(54, 162, 235, 0.6)',
        'rgba(255, 206, 86, 0.6)',
        'rgba(75, 192, 192, 0.6)',
        'rgba(153, 102, 255, 0.6)',
        'rgba(255, 159, 64, 0.6)',
      ][index % 6];
      
      datasets.push({
        label: party,
        data: partyData,
        backgroundColor: constituencyNames.map(() => backgroundColor),
        borderColor: constituencyNames.map(() => backgroundColor.replace('0.6', '1')),
        borderWidth: 1,
      });
    });
    
    return {
      labels: constituencyNames,
      datasets,
    };
  };

  const calculateTotalVotes = (constituency: ConstituencyResult) => {
    return constituency.candidates.reduce((sum, candidate) => sum + candidate.voteCount, 0);
  };

  const findWinningCandidate = (constituency: ConstituencyResult) => {
    if (constituency.candidates.length === 0) return null;
    
    return constituency.candidates.reduce((prev, current) => 
      (prev.voteCount > current.voteCount) ? prev : current
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !results) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'Election results not found'}
        </Alert>
        <Button variant="outlined" onClick={() => navigate('/results')}>
          Back to Results
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" component="h1">
          Election Results
        </Typography>
        <Button 
          variant="outlined" 
          color="primary" 
          onClick={() => navigate('/elections')}
        >
          Back to Elections
        </Button>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {results.name}
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={3}>
            <Typography variant="subtitle2" color="text.secondary">
              Status
            </Typography>
          </Grid>
          <Grid item xs={12} sm={9}>
            {getStatusChip(results.status)}
          </Grid>
          
          <Grid item xs={12} sm={3}>
            <Typography variant="subtitle2" color="text.secondary">
              Start Time
            </Typography>
          </Grid>
          <Grid item xs={12} sm={9}>
            <Typography variant="body1">{formatDate(results.startTime)}</Typography>
          </Grid>
          
          <Grid item xs={12} sm={3}>
            <Typography variant="subtitle2" color="text.secondary">
              End Time
            </Typography>
          </Grid>
          <Grid item xs={12} sm={9}>
            <Typography variant="body1">{formatDate(results.endTime)}</Typography>
          </Grid>
          
          <Grid item xs={12} sm={3}>
            <Typography variant="subtitle2" color="text.secondary">
              Constituencies
            </Typography>
          </Grid>
          <Grid item xs={12} sm={9}>
            <Typography variant="body1">{results.constituencies.length}</Typography>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ mb: 3 }}>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Overall Results
          </Typography>
          <Divider sx={{ mb: 2 }} />
        </Box>
        
        <Box sx={{ height: 400, p: 3 }}>
          {generateOverallChartData() && (
            <Bar 
              data={generateOverallChartData()} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  title: {
                    display: true,
                    text: 'Votes by Party and Constituency'
                  },
                  legend: {
                    position: 'top',
                  },
                },
              }}
            />
          )}
        </Box>
      </Paper>

      <Paper>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="constituency tabs"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          {results.constituencies.map((constituency, index) => (
            <Tab 
              key={constituency.constituencyId} 
              label={constituency.name} 
              id={`constituency-tab-${index}`}
              aria-controls={`constituency-tabpanel-${index}`}
            />
          ))}
        </Tabs>
        
        {results.constituencies.map((constituency, index) => (
          <TabPanel key={constituency.constituencyId} value={tabValue} index={index}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Summary
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Total Votes
                      </Typography>
                      <Typography variant="h4">
                        {calculateTotalVotes(constituency)}
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Winning Candidate
                      </Typography>
                      {findWinningCandidate(constituency) && (
                        <>
                          <Typography variant="h5">
                            {findWinningCandidate(constituency)?.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {findWinningCandidate(constituency)?.partyId} • {findWinningCandidate(constituency)?.voteCount} votes
                          </Typography>
                        </>
                      )}
                    </Box>
                  </CardContent>
                </Card>
                
                <Box sx={{ height: 300 }}>
                  <Doughnut 
                    data={generateChartData(constituency)} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'right',
                        },
                      },
                    }}
                  />
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Candidate Results
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                {constituency.candidates.length > 0 ? (
                  constituency.candidates
                    .sort((a, b) => b.voteCount - a.voteCount)
                    .map((candidate) => {
                      const totalVotes = calculateTotalVotes(constituency);
                      const percentage = totalVotes > 0 
                        ? Math.round((candidate.voteCount / totalVotes) * 100) 
                        : 0;
                      
                      return (
                        <Box key={candidate.candidateId} sx={{ mb: 3 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="subtitle1">
                              {candidate.name}
                            </Typography>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {candidate.voteCount} votes
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                            <Box sx={{ flexGrow: 1, mr: 1 }}>
                              <LinearProgress 
                                variant="determinate" 
                                value={percentage} 
                                sx={{ 
                                  height: 10, 
                                  borderRadius: 5,
                                  backgroundColor: 'rgba(0,0,0,0.1)',
                                  '& .MuiLinearProgress-bar': {
                                    backgroundColor: candidate === findWinningCandidate(constituency) 
                                      ? 'success.main' 
                                      : 'primary.main'
                                  }
                                }} 
                              />
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                              {percentage}%
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            Party: {candidate.partyId}
                          </Typography>
                        </Box>
                      );
                    })
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No candidates found for this constituency.
                  </Typography>
                )}
              </Grid>
            </Grid>
          </TabPanel>
        ))}
      </Paper>
    </Box>
  );
};

export default ElectionResultsView;
