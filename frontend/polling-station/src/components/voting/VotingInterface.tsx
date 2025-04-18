import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid as MuiGrid,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Divider,
  Card,
  CardContent,
  CardActionArea,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Chip
} from '@mui/material';
import {
  Person as PersonIcon,
  ArrowBack as BackIcon,
  HowToVote as VoteIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { useStationAuth } from '../../contexts/StationAuthContext';
import { voterApi, electionsApi, candidatesApi, votingApi } from '../../services/api';
import { Voter, Election, Candidate } from '../../types';

// Create a Grid component that properly handles the 'item' prop
const Grid = (props: any) => <MuiGrid {...props} />;

const VotingInterface: React.FC = () => {
  const { electionId, voterId } = useParams<{ electionId: string, voterId: string }>();
  const navigate = useNavigate();
  const { station, isAuthenticated } = useStationAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [voter, setVoter] = useState<Voter | null>(null);
  const [election, setElection] = useState<Election | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [votingLoading, setVotingLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [transactionId, setTransactionId] = useState<string | null>(null);

  const steps = ['Select Candidate', 'Confirm Vote', 'Vote Recorded'];

  useEffect(() => {
    if (isAuthenticated && station && electionId && voterId) {
      fetchVoterDetails();
      fetchElectionDetails();
      fetchCandidates();
    }
  }, [isAuthenticated, station, electionId, voterId]);

  const fetchVoterDetails = async () => {
    try {
      if (!voterId) return;
      
      const response = await voterApi.getVoterStatus(voterId);
      if (response.data.success) {
        // In a real implementation, we would fetch the voter details from the API
        // For now, we'll create a mock voter object
        setVoter({
          voterId: voterId,
          voterIdHash: '',
          aadharHash: '',
          constituencyId: station?.constituencyId || '',
          eligibilityStatus: 'ELIGIBLE',
          hasVoted: response.data.data.hasVoted,
          createdAt: '',
          updatedAt: ''
        });
      } else {
        setError('Failed to fetch voter details. Please try again.');
      }
    } catch (err) {
      console.error('Failed to fetch voter details:', err);
      setError('Failed to fetch voter details. Please try again.');
    }
  };

  const fetchElectionDetails = async () => {
    try {
      if (!electionId) return;
      
      const response = await electionsApi.getElectionById(electionId);
      setElection(response.data.data);
    } catch (err) {
      console.error('Failed to fetch election details:', err);
      setError('Failed to fetch election details. Please try again.');
    }
  };

  const fetchCandidates = async () => {
    try {
      if (!station || !electionId) return;
      
      const response = await candidatesApi.getByConstituency(station.constituencyId);
      const allCandidates = response.data.data;
      
      // Filter candidates for the selected election
      const filteredCandidates = allCandidates.filter(
        (candidate: Candidate) => candidate.electionId === electionId
      );
      
      setCandidates(filteredCandidates);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch candidates:', err);
      setError('Failed to fetch candidates. Please try again.');
      setLoading(false);
    }
  };

  const handleCandidateSelect = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setActiveStep(1);
  };

  const handleConfirmVote = async () => {
    if (!voter || !selectedCandidate || !election || !station) return;
    
    try {
      setVotingLoading(true);
      setError(null);
      
      const response = await votingApi.castVote({
        electionId: election.electionId,
        candidateId: selectedCandidate.candidateId,
        voterId: voter.voterId,
        pollingStationId: station.stationId
      });
      
      const { success, message, transactionId } = response.data.data;
      
      if (success && transactionId) {
        setTransactionId(transactionId);
        setConfirmDialogOpen(false);
        setSuccessDialogOpen(true);
        setActiveStep(2);
        
        // Update voter status
        setVoter({
          ...voter,
          hasVoted: true
        });
      } else {
        setError(message || 'Failed to cast vote. Please try again later.');
      }
    } catch (err: any) {
      console.error('Failed to cast vote:', err);
      setError(err.response?.data?.message || 'Failed to cast vote. Please try again later.');
    } finally {
      setVotingLoading(false);
    }
  };

  const handleBack = () => {
    if (activeStep === 1) {
      setSelectedCandidate(null);
      setActiveStep(0);
    } else {
      navigate('/verify-voter');
    }
  };

  const handleFinish = () => {
    navigate('/');
  };

  if (!isAuthenticated) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h5" gutterBottom>
          Please log in to access the voting interface
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

  if (!voter || !election) {
    return (
      <Box>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/verify-voter')}
          sx={{ mb: 3 }}
        >
          Back to Voter Verification
        </Button>
        <Alert severity="error">
          Voter or election information not found. Please verify the voter again.
        </Alert>
      </Box>
    );
  }

  if (voter.hasVoted) {
    return (
      <Box>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/')}
          sx={{ mb: 3 }}
        >
          Back to Dashboard
        </Button>
        <Alert severity="warning" sx={{ mb: 3 }}>
          This voter has already cast their vote in this election. Each voter can only vote once.
        </Alert>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <CheckIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Vote Already Cast
          </Typography>
          <Typography variant="body1" paragraph>
            This voter has already participated in the democratic process.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/verify-voter')}
            sx={{ mt: 2 }}
          >
            Verify Another Voter
          </Button>
        </Paper>
      </Box>
    );
  }

  if (station.status !== 'ACTIVE') {
    return (
      <Box>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/')}
          sx={{ mb: 3 }}
        >
          Back to Dashboard
        </Button>
        <Alert severity="warning">
          This polling station is currently inactive. Please contact the election commission to activate it.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Button
        startIcon={<BackIcon />}
        onClick={handleBack}
        sx={{ mb: 3 }}
      >
        {activeStep === 0 ? 'Back to Voter Verification' : 'Back to Candidate Selection'}
      </Button>

      <Typography variant="h5" component="h1" gutterBottom>
        {election.name} - Cast Your Vote
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Voter ID: {voter.voterId} | Constituency: {station.constituencyName}
      </Typography>

      <Stepper activeStep={activeStep} sx={{ my: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {activeStep === 0 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Select a Candidate
          </Typography>
          <Divider sx={{ mb: 3 }} />
          
          <Alert severity="info" sx={{ mb: 3 }}>
            Please ensure the voter has privacy while selecting their candidate.
          </Alert>
          
          {candidates.length > 0 ? (
            <Grid container spacing={2}>
              {candidates.map((candidate) => (
                <Grid item xs={12} sm={6} md={4} key={candidate.candidateId}>
                  <Card 
                    variant="outlined"
                    sx={{ 
                      height: '100%',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 3
                      }
                    }}
                  >
                    <CardActionArea 
                      onClick={() => handleCandidateSelect(candidate)}
                      sx={{ height: '100%', p: 2 }}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <PersonIcon sx={{ fontSize: 40, mr: 1, color: 'primary.main' }} />
                          <Typography variant="h6">
                            {candidate.name}
                          </Typography>
                        </Box>
                        <Divider sx={{ mb: 2 }} />
                        <Typography variant="body1" gutterBottom>
                          <strong>Party:</strong> {candidate.party}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Constituency:</strong> {candidate.constituencyName}
                        </Typography>
                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                          <Chip 
                            label="Tap to Vote" 
                            color="primary" 
                            variant="outlined"
                            size="small"
                          />
                        </Box>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Alert severity="warning" icon={<CancelIcon />}>
              No candidates found for this election in your constituency.
            </Alert>
          )}
        </Box>
      )}

      {activeStep === 1 && selectedCandidate && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Confirm Your Vote
          </Typography>
          <Divider sx={{ mb: 3 }} />
          
          <Alert severity="warning" sx={{ mb: 3 }}>
            Please review your selection carefully. Once your vote is cast, it cannot be changed.
          </Alert>
          
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Your Selection
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <PersonIcon sx={{ fontSize: 30, mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">
                {selectedCandidate.name}
              </Typography>
            </Box>
            <Typography variant="body1" gutterBottom>
              <strong>Party:</strong> {selectedCandidate.party}
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>Constituency:</strong> {selectedCandidate.constituencyName}
            </Typography>
            <Typography variant="body1">
              <strong>Election:</strong> {election.name}
            </Typography>
          </Paper>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button
              variant="outlined"
              onClick={() => setActiveStep(0)}
            >
              Change Selection
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<VoteIcon />}
              onClick={() => setConfirmDialogOpen(true)}
            >
              Cast Vote
            </Button>
          </Box>
        </Box>
      )}

      {activeStep === 2 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Paper sx={{ p: 4 }}>
            <CheckIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Vote Successfully Cast
            </Typography>
            <Typography variant="body1" paragraph>
              The vote has been successfully recorded on the blockchain.
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Thank you for participating in the democratic process.
            </Typography>
            {transactionId && (
              <Box sx={{ mt: 2, mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Transaction ID (for reference):
                </Typography>
                <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                  {transactionId}
                </Typography>
              </Box>
            )}
            <Button
              variant="contained"
              color="primary"
              onClick={handleFinish}
              sx={{ mr: 2 }}
            >
              Return to Dashboard
            </Button>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => navigate('/verify-voter')}
            >
              Verify Another Voter
            </Button>
          </Paper>
        </Box>
      )}

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => !votingLoading && setConfirmDialogOpen(false)}
      >
        <DialogTitle>Confirm Vote</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cast your vote for <strong>{selectedCandidate?.name}</strong> ({selectedCandidate?.party})? 
            This action cannot be undone, and you can only vote once in this election.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setConfirmDialogOpen(false)} 
            disabled={votingLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmVote} 
            color="primary" 
            variant="contained"
            disabled={votingLoading}
            startIcon={votingLoading ? <CircularProgress size={20} /> : <VoteIcon />}
          >
            {votingLoading ? 'Processing...' : 'Confirm Vote'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Dialog */}
      <Dialog
        open={successDialogOpen}
        onClose={() => setSuccessDialogOpen(false)}
      >
        <DialogTitle>Vote Successfully Cast</DialogTitle>
        <DialogContent>
          <DialogContentText>
            The vote has been successfully recorded on the blockchain. Thank you for participating in the democratic process.
          </DialogContentText>
          {transactionId && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Transaction ID (for reference):
              </Typography>
              <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                {transactionId}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setSuccessDialogOpen(false)} 
            color="primary"
          >
            Close
          </Button>
          <Button 
            onClick={handleFinish} 
            color="primary" 
            variant="contained"
          >
            Return to Dashboard
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VotingInterface;
