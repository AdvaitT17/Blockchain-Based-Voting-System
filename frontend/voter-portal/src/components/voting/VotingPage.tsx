import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Divider,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  Paper
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  HowToVote as VoteIcon,
  CheckCircle as CheckIcon,
  Person as PersonIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useVoterAuth } from '../../contexts/VoterAuthContext';
import { electionsApi, votingApi } from '../../services/api';
import { Election, Candidate } from '../../types';
import GridItem from '../common/GridItem';

const VotingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { voter, isAuthenticated } = useVoterAuth();
  const [election, setElection] = useState<Election | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [votingLoading, setVotingLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [voteId, setVoteId] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);

  const steps = ['Select Candidate', 'Confirm Vote', 'Vote Recorded'];

  useEffect(() => {
    if (isAuthenticated && id) {
      fetchElectionDetails();
    }
  }, [isAuthenticated, id]);

  const fetchElectionDetails = async () => {
    try {
      setLoading(true);
      const response = await electionsApi.getElectionById(id || '');
      if (response.data.success) {
        setElection(response.data.data);
        setError(null);
      } else {
        setError(response.data.message || 'Failed to load election details');
      }
    } catch (err) {
      console.error('Failed to fetch election details:', err);
      setError('Failed to load election details. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const getCandidatesForVoterDistrict = () => {
    if (!election || !voter) return [];
    return election.candidates.filter(
      (candidate) => candidate.constituencyId === voter.votingDistrict
    );
  };

  const handleCandidateSelect = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setActiveStep(1);
  };

  const handleConfirmVote = async () => {
    if (!voter || !selectedCandidate || !election) return;
    
    try {
      setVotingLoading(true);
      setError(null);
      
      const response = await votingApi.castVote({
        electionId: election.electionId,
        candidateId: selectedCandidate.candidateId,
        voterId: voter.voterId,
        pollingStationId: 'online' // For online voting
      });
      
      if (response.data.success) {
        setVoteId(response.data.data.voteId);
        setConfirmDialogOpen(false);
        setSuccessDialogOpen(true);
        setActiveStep(2);
      } else {
        setError(response.data.message || 'Failed to cast vote. Please try again later.');
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
      navigate(`/elections/${id}`);
    }
  };

  const handleFinish = () => {
    navigate('/');
  };

  if (!isAuthenticated) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h5" gutterBottom>
          Please log in to access the voting page
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

  if (!election) {
    return (
      <Box>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/')}
          sx={{ mb: 3 }}
        >
          Back to Home
        </Button>
        <Alert severity="error">
          Election not found or has been deleted.
        </Alert>
      </Box>
    );
  }

  const hasVotedInElection = voter?.votedElections?.includes(election.electionId) || false;

  if (hasVotedInElection) {
    return (
      <Box>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/')}
          sx={{ mb: 3 }}
        >
          Back to Home
        </Button>
        <Alert severity="info" sx={{ mb: 3 }}>
          You have already cast your vote in this election. Each voter can only vote once.
        </Alert>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <CheckIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Your Vote Has Been Recorded
          </Typography>
          <Typography variant="body1" paragraph>
            Thank you for participating in the democratic process.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Your vote is securely stored on the blockchain and will be counted when the election ends.
          </Typography>
        </Paper>
      </Box>
    );
  }

  if (election.status !== 'ACTIVE') {
    let message = '';
    let severity: 'warning' | 'error' | 'info' = 'info';
    
    if (election.status === 'UPCOMING') {
      message = `This election has not started yet. Voting will be available from ${new Date(election.startDate).toLocaleDateString()}.`;
      severity = 'warning';
    } else if (election.status === 'COMPLETED') {
      message = 'This election has ended. Voting is no longer available.';
      severity = 'error';
    }
    
    return (
      <Box>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/')}
          sx={{ mb: 3 }}
        >
          Back to Home
        </Button>
        <Alert severity={severity} sx={{ mb: 3 }}>
          {message}
        </Alert>
      </Box>
    );
  }

  const isEligible = election.constituencies.includes(voter?.votingDistrict || '');
  if (!isEligible) {
    return (
      <Box>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/')}
          sx={{ mb: 3 }}
        >
          Back to Home
        </Button>
        <Alert severity="warning" sx={{ mb: 3 }}>
          You are not eligible to vote in this election as it does not include your constituency.
        </Alert>
      </Box>
    );
  }

  const candidates = getCandidatesForVoterDistrict();

  return (
    <Box>
      <Button
        startIcon={<BackIcon />}
        onClick={handleBack}
        sx={{ mb: 3 }}
      >
        {activeStep === 0 ? 'Back to Election Details' : 'Back to Candidate Selection'}
      </Button>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          {election.name} - Cast Your Vote
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Your vote is anonymous and will be securely recorded on the blockchain.
        </Typography>
      </Box>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
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
          
          {candidates.length > 0 ? (
            <Grid container spacing={2}>
              {candidates.map((candidate) => (
                <GridItem xs={12} sm={6} md={4} key={candidate.candidateId}>
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
                      sx={{ height: '100%' }}
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
                          <strong>Constituency:</strong> {voter?.votingDistrict}
                        </Typography>
                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                          <Chip 
                            label="Click to Select" 
                            color="primary" 
                            variant="outlined"
                            size="small"
                          />
                        </Box>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </GridItem>
              ))}
            </Grid>
          ) : (
            <Alert severity="info" icon={<InfoIcon />}>
              No candidates found for your constituency in this election.
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
              <strong>Constituency:</strong> {voter?.votingDistrict}
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
              Your Vote Has Been Successfully Recorded
            </Typography>
            <Typography variant="body1" paragraph>
              Thank you for participating in the democratic process.
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Your vote is securely stored on the blockchain and will be counted when the election ends.
            </Typography>
            {voteId && (
              <Box sx={{ mt: 2, mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Vote ID (for your reference):
                </Typography>
                <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                  {voteId}
                </Typography>
              </Box>
            )}
            <Button
              variant="contained"
              color="primary"
              onClick={handleFinish}
            >
              Return to Home
            </Button>
          </Paper>
        </Box>
      )}

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => !votingLoading && setConfirmDialogOpen(false)}
      >
        <DialogTitle>Confirm Your Vote</DialogTitle>
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
            Your vote has been successfully recorded on the blockchain. Thank you for participating in the democratic process.
          </DialogContentText>
          {voteId && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Vote ID (for your reference):
              </Typography>
              <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                {voteId}
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
            Return to Home
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VotingPage;
