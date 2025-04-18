import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  Grid,
  Avatar,
  CircularProgress,
} from '@mui/material';
import {
  CalendarMonth,
  LocationOn,
  HowToVote,
  CheckCircle,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useVoterAuth } from '../../contexts/VoterAuthContext';
import { electionsApi, candidatesApi, votingApi } from '../../services/api';
import { Election, Candidate } from '../../types';
import GridItem from '../common/GridItem';

const ElectionDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { voter } = useVoterAuth();
  const [election, setElection] = useState<Election | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState<boolean>(false);
  const [voteSuccess, setVoteSuccess] = useState<boolean>(false);
  const [voteError, setVoteError] = useState<string | null>(null);

  useEffect(() => {
    const fetchElection = async () => {
      try {
        setLoading(true);
        const response = await electionsApi.getElectionById(id!);
        setElection(response.data.data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch election details');
      } finally {
        setLoading(false);
      }
    };

    fetchElection();
  }, [id]);

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        if (!voter) return;
        
        const response = await candidatesApi.getByConstituency(voter.constituencyId!);
        const filteredCandidates = response.data.data.filter(
          (candidate: Candidate) => candidate.electionId === id
        );
        setCandidates(filteredCandidates);
      } catch (err: any) {
        console.error('Failed to fetch candidates:', err);
      }
    };

    if (election) {
      fetchCandidates();
    }
  }, [election, id, voter]);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPP p');
    } catch (err) {
      return dateString;
    }
  };

  const getElectionStatus = () => {
    if (!election) {
      return { status: 'UNKNOWN', label: 'Unknown', color: 'default' as const };
    }
    
    // If the election has an explicit status field, use that
    if (election.status === 'ACTIVE') {
      return { status: 'ACTIVE', label: 'Active', color: 'success' as const };
    }
    
    const now = new Date();
    const startTime = new Date(election.startTime || election.startDate);
    const endTime = new Date(election.endTime || election.endDate);

    if (now < startTime) {
      return { status: 'UPCOMING', label: 'Upcoming', color: 'info' as const };
    } else if (now >= startTime && now <= endTime) {
      return { status: 'ACTIVE', label: 'Active', color: 'success' as const };
    } else {
      return { status: 'COMPLETED', label: 'Completed', color: 'default' as const };
    }
  };

  const isEligibleToVote = () => {
    if (!voter || !election) return false;
    
    console.log('Voter:', voter);
    console.log('Election:', election);
    console.log('Voter district:', voter.votingDistrict);
    console.log('Voter constituency:', voter.constituencyId);
    console.log('Election constituencies:', election.constituencies);
    
    // Check if either votingDistrict or constituencyId is in the election constituencies
    const districtMatch = election.constituencies.includes(voter.votingDistrict);
    const constituencyMatch = voter.constituencyId ? election.constituencies.includes(voter.constituencyId) : false;
    
    console.log('District match:', districtMatch);
    console.log('Constituency match:', constituencyMatch);
    console.log('Election status:', getElectionStatus().status);
    console.log('Has voted:', voter.hasVoted);
    
    return (
      (districtMatch || constituencyMatch) &&
      getElectionStatus().status === 'ACTIVE' &&
      !voter.hasVoted
    );
  };

  const handleVoteClick = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setConfirmDialogOpen(true);
  };

  const handleConfirmVote = async () => {
    try {
      if (!selectedCandidate || !voter || !election) return;

      const response = await votingApi.castVote({
        voterId: voter.voterId,
        electionId: election.electionId,
        candidateId: selectedCandidate.candidateId
      });

      if (response.data.success) {
        setVoteSuccess(true);
        // Update voter status locally
        voter.hasVoted = true;
        voter.votedElections.push(election.electionId);
      } else {
        setVoteError(response.data.message);
      }
    } catch (err: any) {
      setVoteError(err.message || 'Failed to cast vote');
    } finally {
      setConfirmDialogOpen(false);
    }
  };

  const handleDialogClose = () => {
    setConfirmDialogOpen(false);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !election) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          {error || 'Election not found'}
        </Alert>
        <Button 
          variant="contained" 
          onClick={() => navigate('/home')}
          sx={{ mt: 2 }}
        >
          Back to Home
        </Button>
      </Box>
    );
  }

  const status = getElectionStatus();

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          {election.name}
        </Typography>
        <Chip 
          label={status.label} 
          color={status.color} 
          sx={{ fontWeight: 'bold' }}
        />
      </Box>

      <Grid container spacing={3}>
        <GridItem xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Election Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <List>
                <ListItem disablePadding sx={{ mb: 1 }}>
                  <ListItemIcon>
                    <CalendarMonth />
                  </ListItemIcon>
                  <ListItemText
                    primary="Start Time"
                    secondary={formatDate(election.startTime || election.startDate)}
                  />
                </ListItem>
                <ListItem disablePadding sx={{ mb: 1 }}>
                  <ListItemIcon>
                    <CalendarMonth />
                  </ListItemIcon>
                  <ListItemText
                    primary="End Time"
                    secondary={formatDate(election.endTime || election.endDate)}
                  />
                </ListItem>
                <ListItem disablePadding>
                  <ListItemIcon>
                    <LocationOn />
                  </ListItemIcon>
                  <ListItemText
                    primary="Constituencies"
                    secondary={election.constituencies.join(', ')}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </GridItem>

        <GridItem xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Your Voting Status
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {voter ? (
                <>
                  <Typography variant="body1" gutterBottom>
                    <strong>Voter ID:</strong> {voter.voterId}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    <strong>Constituency:</strong> {voter.constituencyId}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    <strong>Eligibility:</strong> {election.constituencies.includes(voter.constituencyId!) ? 'Eligible to vote' : 'Not eligible for this election'}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Voting Status:</strong> {voter.hasVoted ? 'Already voted' : 'Not voted yet'}
                  </Typography>
                  
                  {isEligibleToVote() && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      You are eligible to vote in this election. Scroll down to see candidates and cast your vote.
                    </Alert>
                  )}
                  
                  {voter.hasVoted && (
                    <Alert severity="success" sx={{ mt: 2 }}>
                      You have already cast your vote. Thank you for participating!
                    </Alert>
                  )}
                  
                  {!election.constituencies.includes(voter.constituencyId!) && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      You are not eligible to vote in this election as it does not include your constituency.
                    </Alert>
                  )}
                </>
              ) : (
                <Alert severity="warning">
                  Please log in to see your voting status.
                </Alert>
              )}
            </CardContent>
          </Card>
        </GridItem>
      </Grid>

      {voteSuccess && (
        <Alert severity="success" sx={{ mt: 3, mb: 3 }}>
          Your vote has been cast successfully! Thank you for participating in this election.
        </Alert>
      )}

      {voteError && (
        <Alert severity="error" sx={{ mt: 3, mb: 3 }}>
          {voteError}
        </Alert>
      )}

      {candidates.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            Candidates
          </Typography>
          <Grid container spacing={2}>
            {candidates.map((candidate) => (
              <GridItem xs={12} sm={6} md={4} key={candidate.candidateId}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                        {candidate.name.charAt(0)}
                      </Avatar>
                      <Typography variant="h6">
                        {candidate.name}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      <strong>Party:</strong> {candidate.party}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Constituency:</strong> {candidate.constituencyName || candidate.constituencyId}
                    </Typography>
                  </CardContent>
                  {isEligibleToVote() && (
                    <Box sx={{ p: 2, pt: 0 }}>
                      <Button
                        variant="contained"
                        color="primary"
                        fullWidth
                        startIcon={<HowToVote />}
                        onClick={() => handleVoteClick(candidate)}
                      >
                        Vote
                      </Button>
                    </Box>
                  )}
                </Card>
              </GridItem>
            ))}
          </Grid>
        </Box>
      )}

      <Dialog
        open={confirmDialogOpen}
        onClose={handleDialogClose}
      >
        <DialogTitle>Confirm Your Vote</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to vote for <strong>{selectedCandidate?.name}</strong> from <strong>{selectedCandidate?.party}</strong>?
          </DialogContentText>
          <DialogContentText sx={{ mt: 2, color: 'error.main' }}>
            This action cannot be undone. Your vote is final once submitted.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleConfirmVote} color="primary" variant="contained" startIcon={<CheckCircle />}>
            Confirm Vote
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ElectionDetails;
