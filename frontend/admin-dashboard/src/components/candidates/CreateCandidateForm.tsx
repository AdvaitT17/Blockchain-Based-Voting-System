import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  FormHelperText
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { candidatesApi, electionsApi } from '../../services/api';
import { CandidateFormData, Election } from '../../types';

const CreateCandidateForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elections, setElections] = useState<Election[]>([]);
  const [selectedElection, setSelectedElection] = useState<Election | null>(null);
  const [loadingElections, setLoadingElections] = useState(true);

  // Get election ID from query params if available
  const queryParams = new URLSearchParams(location.search);
  const electionIdParam = queryParams.get('electionId');

  useEffect(() => {
    fetchElections();
  }, []);

  useEffect(() => {
    if (electionIdParam && elections.length > 0) {
      const election = elections.find(e => e.electionId === electionIdParam);
      if (election) {
        setSelectedElection(election);
        formik.setFieldValue('electionId', electionIdParam);
      }
    }
  }, [electionIdParam, elections]);

  const fetchElections = async () => {
    try {
      setLoadingElections(true);
      const response = await electionsApi.getAll();
      // Filter out elections that are not in CREATED or UPCOMING status
      const activeElections = response.data.data.filter(
        (election: Election) => 
          election.status === 'CREATED' || 
          election.status === 'UPCOMING'
      );
      setElections(activeElections);
    } catch (err) {
      console.error('Failed to fetch elections:', err);
      setError('Failed to load elections. Please try again later.');
    } finally {
      setLoadingElections(false);
    }
  };

  const validationSchema = Yup.object({
    name: Yup.string().required('Candidate name is required'),
    partyId: Yup.string().required('Party ID is required'),
    constituencyId: Yup.string().required('Constituency is required'),
    electionId: Yup.string().required('Election is required')
  });

  const formik = useFormik<CandidateFormData>({
    initialValues: {
      name: '',
      partyId: '',
      constituencyId: '',
      electionId: electionIdParam || ''
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        setError(null);
        await candidatesApi.create(values);
        navigate(`/elections/${values.electionId}`);
      } catch (err: any) {
        console.error('Failed to register candidate:', err);
        setError(err.response?.data?.message || 'Failed to register candidate. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  });

  const handleElectionChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const electionId = event.target.value as string;
    formik.setFieldValue('electionId', electionId);
    formik.setFieldValue('constituencyId', ''); // Reset constituency when election changes
    
    const election = elections.find(e => e.electionId === electionId);
    setSelectedElection(election || null);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" component="h1">
          Register Candidate
        </Typography>
        <Button 
          variant="outlined" 
          color="primary" 
          onClick={() => navigate('/candidates')}
        >
          Back to Candidates
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <form onSubmit={formik.handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="name"
                name="name"
                label="Candidate Name"
                variant="outlined"
                value={formik.values.name}
                onChange={formik.handleChange}
                error={formik.touched.name && Boolean(formik.errors.name)}
                helperText={formik.touched.name && formik.errors.name}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                id="partyId"
                name="partyId"
                label="Party ID"
                variant="outlined"
                value={formik.values.partyId}
                onChange={formik.handleChange}
                error={formik.touched.partyId && Boolean(formik.errors.partyId)}
                helperText={formik.touched.partyId && formik.errors.partyId}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth error={formik.touched.electionId && Boolean(formik.errors.electionId)}>
                <InputLabel id="election-label">Election</InputLabel>
                <Select
                  labelId="election-label"
                  id="electionId"
                  name="electionId"
                  value={formik.values.electionId}
                  onChange={handleElectionChange}
                  label="Election"
                  disabled={loadingElections || !!electionIdParam}
                >
                  {loadingElections ? (
                    <MenuItem value="">
                      <CircularProgress size={20} /> Loading...
                    </MenuItem>
                  ) : (
                    elections.map((election) => (
                      <MenuItem key={election.electionId} value={election.electionId}>
                        {election.name}
                      </MenuItem>
                    ))
                  )}
                </Select>
                {formik.touched.electionId && formik.errors.electionId && (
                  <FormHelperText>{formik.errors.electionId}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControl 
                fullWidth 
                error={formik.touched.constituencyId && Boolean(formik.errors.constituencyId)}
                disabled={!selectedElection}
              >
                <InputLabel id="constituency-label">Constituency</InputLabel>
                <Select
                  labelId="constituency-label"
                  id="constituencyId"
                  name="constituencyId"
                  value={formik.values.constituencyId}
                  onChange={formik.handleChange}
                  label="Constituency"
                >
                  {selectedElection ? (
                    selectedElection.constituencies.map((constituency) => (
                      <MenuItem key={constituency} value={constituency}>
                        {constituency}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem value="">
                      {loadingElections ? 'Loading...' : 'Select an election first'}
                    </MenuItem>
                  )}
                </Select>
                {formik.touched.constituencyId && formik.errors.constituencyId && (
                  <FormHelperText>{formik.errors.constituencyId}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => navigate('/candidates')}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                  {loading ? 'Registering...' : 'Register Candidate'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default CreateCandidateForm;
