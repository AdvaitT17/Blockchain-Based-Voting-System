import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  Card,
  CardContent,
  IconButton
} from '@mui/material';
import {
  PlayArrow as StartIcon,
  Stop as EndIcon,
  Add as AddIcon,
  Assessment as ResultsIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { electionsApi, candidatesApi } from '../../services/api';
import { Election, Candidate } from '../../types';
import { format } from 'date-fns';

const ElectionDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [election, setElection] = useState<Election | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchElectionDetails(id);
    }
  }, [id]);

  const fetchElectionDetails = async (electionId: string) => {
    try {
      setLoading(true);
      const electionResponse = await electionsApi.getById(electionId);
      setElection(electionResponse.data.data);

      // Fetch candidates for this election
      try {
        const candidatesResponse = await candidatesApi.getByElection(electionId);
        setCandidates(candidatesResponse.data.data);
      } catch (err) {
        console.error('Failed to fetch candidates:', err);
        // Don't set error here, as we still have the election data
      }
    } catch (err) {
      console.error('Failed to fetch election details:', err);
      setError('Failed to load election details. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartElection = async () => {
    if (!id) return;
    try {
      await electionsApi.start(id);
      fetchElectionDetails(id); // Refresh the data
    } catch (err) {
      console.error('Failed to start election:', err);
      setError('Failed to start election. Please try again later.');
    }
  };

  const handleEndElection = async () => {
    if (!id) return;
    try {
      await electionsApi.end(id);
      fetchElectionDetails(id); // Refresh the data
    } catch (err) {
      console.error('Failed to end election:', err);
      setError('Failed to end election. Please try again later.');
    }
  };

  const handleAddCandidate = () => {
    navigate(`/candidates/create?electionId=${id}`);
  };

  const handleViewResults = () => {
    navigate(`/results/${id}`);
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !election) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'Election not found'}
        </Alert>
        <Button variant="outlined" onClick={() => navigate('/elections')}>
          Back to Elections
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" component="h1">
          Election Details
        </Typography>
        <Box>
          <Button 
            variant="outlined" 
            color="primary" 
            onClick={() => navigate('/elections')}
            sx={{ mr: 1 }}
          >
            Back to Elections
          </Button>
          {election.status === 'UPCOMING' && (
            <Button
              variant="contained"
              color="success"
              startIcon={<StartIcon />}
              onClick={handleStartElection}
            >
              Start Election
            </Button>
          )}
          {election.status === 'ACTIVE' && (
            <Button
              variant="contained"
              color="error"
              startIcon={<EndIcon />}
              onClick={handleEndElection}
            >
              End Election
            </Button>
          )}
          {election.status === 'ENDED' && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<ResultsIcon />}
              onClick={handleViewResults}
            >
              View Results
            </Button>
          )}
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Election Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={3}>
                <Typography variant="subtitle2" color="text.secondary">
                  Name
                </Typography>
              </Grid>
              <Grid item xs={12} sm={9}>
                <Typography variant="body1">{election.name}</Typography>
              </Grid>
              
              <Grid item xs={12} sm={3}>
                <Typography variant="subtitle2" color="text.secondary">
                  Status
                </Typography>
              </Grid>
              <Grid item xs={12} sm={9}>
                {getStatusChip(election.status)}
              </Grid>
              
              <Grid item xs={12} sm={3}>
                <Typography variant="subtitle2" color="text.secondary">
                  Start Time
                </Typography>
              </Grid>
              <Grid item xs={12} sm={9}>
                <Typography variant="body1">{formatDate(election.startTime)}</Typography>
              </Grid>
              
              <Grid item xs={12} sm={3}>
                <Typography variant="subtitle2" color="text.secondary">
                  End Time
                </Typography>
              </Grid>
              <Grid item xs={12} sm={9}>
                <Typography variant="body1">{formatDate(election.endTime)}</Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Constituencies
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {election.constituencies.map((constituency) => (
                    <Chip key={constituency} label={constituency} variant="outlined" />
                  ))}
                </Box>
              </Grid>
            </Grid>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Candidates
              </Typography>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddCandidate}
                disabled={election.status === 'ACTIVE' || election.status === 'ENDED'}
              >
                Add Candidate
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            {candidates.length > 0 ? (
              <Grid container spacing={2}>
                {candidates.map((candidate) => (
                  <Grid item xs={12} sm={6} md={4} key={candidate.candidateId}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {candidate.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Party: {candidate.partyId}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Constituency: {candidate.constituencyId}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No candidates registered for this election yet.
              </Typography>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Election Timeline
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <List>
              <ListItem>
                <ListItemText
                  primary="Election Created"
                  secondary="The election was created and is in setup phase"
                />
                <Chip label="Done" color="success" size="small" />
              </ListItem>
              
              <ListItem>
                <ListItemText
                  primary="Candidate Registration"
                  secondary="Register candidates for each constituency"
                />
                <Chip 
                  label={candidates.length > 0 ? "In Progress" : "Not Started"} 
                  color={candidates.length > 0 ? "info" : "default"} 
                  size="small" 
                />
              </ListItem>
              
              <ListItem>
                <ListItemText
                  primary="Election Start"
                  secondary={`Scheduled for ${formatDate(election.startTime)}`}
                />
                <Chip 
                  label={election.status === 'ACTIVE' || election.status === 'ENDED' ? "Done" : "Pending"} 
                  color={election.status === 'ACTIVE' || election.status === 'ENDED' ? "success" : "warning"} 
                  size="small" 
                />
              </ListItem>
              
              <ListItem>
                <ListItemText
                  primary="Voting Period"
                  secondary={`From ${formatDate(election.startTime)} to ${formatDate(election.endTime)}`}
                />
                <Chip 
                  label={
                    election.status === 'ACTIVE' 
                      ? "In Progress" 
                      : election.status === 'ENDED' 
                        ? "Completed" 
                        : "Not Started"
                  } 
                  color={
                    election.status === 'ACTIVE' 
                      ? "info" 
                      : election.status === 'ENDED' 
                        ? "success" 
                        : "default"
                  } 
                  size="small" 
                />
              </ListItem>
              
              <ListItem>
                <ListItemText
                  primary="Results Declaration"
                  secondary="After election ends, results will be available"
                />
                <Chip 
                  label={election.status === 'ENDED' ? "Available" : "Pending"} 
                  color={election.status === 'ENDED' ? "success" : "default"} 
                  size="small" 
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ElectionDetails;
