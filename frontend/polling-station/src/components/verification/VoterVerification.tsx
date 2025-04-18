import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
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
  InputAdornment,
  IconButton
} from '@mui/material';
import {
  Person as PersonIcon,
  ArrowBack as BackIcon,
  Search as SearchIcon,
  Visibility,
  VisibilityOff,
  CheckCircle as VerifiedIcon,
  Cancel as RejectedIcon,
  HowToVote as VoteIcon
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useStationAuth } from '../../contexts/StationAuthContext';
import { voterApi, electionsApi, candidatesApi } from '../../services/api';
import { Voter, Election, Candidate } from '../../types';

// Create a Grid component that properly handles the 'item' prop
const Grid = (props: any) => <MuiGrid {...props} />;

const VoterVerification: React.FC = () => {
  const navigate = useNavigate();
  const { station, isAuthenticated } = useStationAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [voter, setVoter] = useState<Voter | null>(null);
  const [elections, setElections] = useState<Election[]>([]);
  const [selectedElection, setSelectedElection] = useState<Election | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAadhar, setShowAadhar] = useState(false);

  const steps = ['Verify Voter', 'Select Election', 'Cast Vote'];

  useEffect(() => {
    if (isAuthenticated && station) {
      fetchActiveElections();
    }
  }, [isAuthenticated, station]);

  const fetchActiveElections = async () => {
    try {
      if (!station) return;
      
      const response = await electionsApi.getActiveElections();
      const allElections = response.data.data;
      
      // Filter elections for this polling station's constituency
      const filteredElections = allElections.filter(
        (election: Election) => election.constituencies.includes(station.constituencyId)
      );
      
      setElections(filteredElections);
    } catch (err) {
      console.error('Failed to fetch active elections:', err);
      setError('Failed to load active elections. Please try again later.');
    }
  };

  const fetchCandidates = async (electionId: string) => {
    try {
      if (!station) return;
      
      const response = await candidatesApi.getByConstituency(station.constituencyId);
      const allCandidates = response.data.data;
      
      // Filter candidates for the selected election
      const filteredCandidates = allCandidates.filter(
        (candidate: Candidate) => candidate.electionId === electionId
      );
      
      setCandidates(filteredCandidates);
    } catch (err) {
      console.error('Failed to fetch candidates:', err);
      setError('Failed to load candidates. Please try again later.');
    }
  };

  const verificationSchema = Yup.object({
    voterId: Yup.string()
      .required('Voter ID is required')
      .matches(/^[A-Z]{3}[0-9]{7}$/, 'Invalid Voter ID format (e.g., ABC1234567)'),
    aadharNumber: Yup.string()
      .required('Aadhar Number is required')
      .matches(/^[0-9]{12}$/, 'Aadhar Number must be 12 digits')
  });

  const verificationForm = useFormik({
    initialValues: {
      voterId: '',
      aadharNumber: ''
    },
    validationSchema: verificationSchema,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await voterApi.verifyVoter({
          voterId: values.voterId,
          aadharNumber: values.aadharNumber
        });
        
        const { success, data, message } = response.data;
        
        if (success && data.valid && data.voter) {
          setVoter(data.voter);
          
          // Check if voter is eligible to vote in this constituency
          if (data.voter.constituencyId !== station?.constituencyId) {
            setError(`This voter belongs to a different constituency (${data.voter.constituencyId}) and cannot vote at this polling station.`);
            return;
          }
          
          // Check if voter has already voted
          if (data.voter.hasVoted) {
            setError('This voter has already cast their vote in this election.');
            return;
          }
          
          setActiveStep(1);
        } else {
          setError(message || 'Voter verification failed. Please check the credentials and try again.');
        }
      } catch (err: any) {
        console.error('Voter verification failed:', err);
        setError(err.response?.data?.message || 'Verification failed. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
  });

  const handleToggleAadharVisibility = () => {
    setShowAadhar(!showAadhar);
  };

  const handleElectionSelect = (election: Election) => {
    setSelectedElection(election);
    fetchCandidates(election.electionId);
    setActiveStep(2);
  };

  const handleBack = () => {
    if (activeStep === 1) {
      setVoter(null);
      setActiveStep(0);
    } else if (activeStep === 2) {
      setSelectedElection(null);
      setCandidates([]);
      setActiveStep(1);
    }
  };

  const handleNavigateToVoting = () => {
    if (voter && selectedElection) {
      navigate(`/voting/${selectedElection.electionId}/${voter.voterId}`);
    }
  };

  if (!isAuthenticated) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h5" gutterBottom>
          Please log in to access the voter verification
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
        onClick={() => activeStep === 0 ? navigate('/') : handleBack()}
        sx={{ mb: 3 }}
      >
        {activeStep === 0 ? 'Back to Dashboard' : 'Back to Previous Step'}
      </Button>

      <Typography variant="h5" component="h1" gutterBottom>
        Voter Verification and Voting
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Verify voter identity and enable them to cast their vote
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
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Verify Voter Identity
          </Typography>
          <Divider sx={{ mb: 3 }} />
          
          <Box component="form" onSubmit={verificationForm.handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="voterId"
                  name="voterId"
                  label="Voter ID"
                  value={verificationForm.values.voterId}
                  onChange={verificationForm.handleChange}
                  onBlur={verificationForm.handleBlur}
                  error={verificationForm.touched.voterId && Boolean(verificationForm.errors.voterId)}
                  helperText={verificationForm.touched.voterId && verificationForm.errors.voterId}
                  disabled={loading}
                  placeholder="Enter Voter ID (e.g., ABC1234567)"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="aadharNumber"
                  name="aadharNumber"
                  label="Aadhar Number"
                  type={showAadhar ? 'text' : 'password'}
                  value={verificationForm.values.aadharNumber}
                  onChange={verificationForm.handleChange}
                  onBlur={verificationForm.handleBlur}
                  error={verificationForm.touched.aadharNumber && Boolean(verificationForm.errors.aadharNumber)}
                  helperText={verificationForm.touched.aadharNumber && verificationForm.errors.aadharNumber}
                  disabled={loading}
                  placeholder="Enter 12-digit Aadhar Number"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle aadhar visibility"
                          onClick={handleToggleAadharVisibility}
                          edge="end"
                        >
                          {showAadhar ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={<SearchIcon />}
                  disabled={loading}
                  sx={{ py: 1.5 }}
                  fullWidth
                >
                  {loading ? <CircularProgress size={24} /> : 'Verify Voter'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      )}

      {activeStep === 1 && voter && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Voter Verified Successfully
          </Typography>
          <Divider sx={{ mb: 3 }} />
          
          <Box sx={{ mb: 4 }}>
            <Alert icon={<VerifiedIcon />} severity="success" sx={{ mb: 3 }}>
              Voter identity has been successfully verified.
            </Alert>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Voter Information
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Typography variant="body1" gutterBottom>
                      <strong>Voter ID:</strong> {voter.voterId}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      <strong>Constituency:</strong> {voter.constituencyId}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Eligibility Status:</strong> {voter.eligibilityStatus}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
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
                    <Typography variant="body1">
                      <strong>Constituency:</strong> {station.constituencyName}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
          
          <Typography variant="h6" gutterBottom>
            Select an Election
          </Typography>
          <Divider sx={{ mb: 3 }} />
          
          {elections.length > 0 ? (
            <Grid container spacing={2}>
              {elections.map((election) => (
                <Grid item xs={12} md={6} key={election.electionId}>
                  <Card 
                    variant="outlined"
                    sx={{ 
                      cursor: 'pointer',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 3
                      }
                    }}
                    onClick={() => handleElectionSelect(election)}
                  >
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {election.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        <strong>Status:</strong> {election.status}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Constituencies:</strong> {election.constituencies.length}
                      </Typography>
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<VoteIcon />}
                        sx={{ mt: 2 }}
                        fullWidth
                      >
                        Select This Election
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Alert severity="info">
              No active elections available for this constituency at the moment.
            </Alert>
          )}
        </Paper>
      )}

      {activeStep === 2 && voter && selectedElection && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Ready to Cast Vote
          </Typography>
          <Divider sx={{ mb: 3 }} />
          
          <Box sx={{ mb: 4 }}>
            <Alert icon={<VerifiedIcon />} severity="success" sx={{ mb: 3 }}>
              Voter is verified and ready to cast their vote.
            </Alert>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Voter Information
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Typography variant="body1" gutterBottom>
                      <strong>Voter ID:</strong> {voter.voterId}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Constituency:</strong> {voter.constituencyId}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Election Information
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Typography variant="body1" gutterBottom>
                      <strong>Election:</strong> {selectedElection.name}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Status:</strong> {selectedElection.status}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
          
          <Typography variant="h6" gutterBottom>
            Proceed to Voting
          </Typography>
          <Divider sx={{ mb: 3 }} />
          
          <Alert severity="info" sx={{ mb: 3 }}>
            The voter will now be directed to the voting interface. Please ensure privacy during the voting process.
          </Alert>
          
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<VoteIcon />}
            onClick={handleNavigateToVoting}
            sx={{ py: 1.5 }}
            fullWidth
          >
            Proceed to Voting Interface
          </Button>
        </Paper>
      )}
    </Box>
  );
};

export default VoterVerification;
