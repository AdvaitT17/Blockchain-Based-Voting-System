import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Grid as MuiGrid,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import { ArrowBack as BackIcon, Save as SaveIcon } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { pollingStationsApi, electionsApi } from '../../services/api';
import { PollingStation, Election } from '../../types';

// Create a Grid component that properly handles the 'item' prop
const Grid = (props: any) => <MuiGrid {...props} />;

interface FormValues {
  name: string;
  location: string;
  constituencyId: string;
}

const CreatePollingStationForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(id ? true : false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [elections, setElections] = useState<Election[]>([]);
  const [constituencies, setConstituencies] = useState<{ id: string, name: string }[]>([]);
  const isEditMode = !!id;

  useEffect(() => {
    fetchElections();
    if (isEditMode) {
      fetchPollingStation();
    }
  }, [id]);

  const fetchElections = async () => {
    try {
      const response = await electionsApi.getAll();
      const electionsData = response.data.data;
      setElections(electionsData);
      
      // Extract constituencies from all elections
      const allConstituencies: { id: string, name: string }[] = [];
      electionsData.forEach((election: Election) => {
        election.constituencies.forEach((constituencyId: string) => {
          // In a real implementation, we would fetch the constituency name from the API
          // For now, we'll use the constituency ID as the name
          allConstituencies.push({
            id: constituencyId,
            name: `Constituency ${constituencyId}`
          });
        });
      });
      
      // Remove duplicates
      const uniqueConstituencies = allConstituencies.filter(
        (constituency, index, self) =>
          index === self.findIndex((c) => c.id === constituency.id)
      );
      
      setConstituencies(uniqueConstituencies);
    } catch (err) {
      console.error('Failed to fetch elections:', err);
      setError('Failed to load constituencies. Please try again later.');
    }
  };

  const fetchPollingStation = async () => {
    try {
      setInitialLoading(true);
      const response = await pollingStationsApi.getById(id || '');
      const stationData = response.data.data;
      
      formik.setValues({
        name: stationData.name,
        location: stationData.location,
        constituencyId: stationData.constituencyId
      });
      
      setError(null);
    } catch (err) {
      console.error('Failed to fetch polling station:', err);
      setError('Failed to load polling station details. Please try again later.');
    } finally {
      setInitialLoading(false);
    }
  };

  const validationSchema = Yup.object({
    name: Yup.string()
      .required('Name is required')
      .max(100, 'Name must be at most 100 characters'),
    location: Yup.string()
      .required('Location is required')
      .max(200, 'Location must be at most 200 characters'),
    constituencyId: Yup.string()
      .required('Constituency is required')
  });

  const formik = useFormik<FormValues>({
    initialValues: {
      name: '',
      location: '',
      constituencyId: ''
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        setError(null);
        setSuccess(null);
        
        if (isEditMode) {
          await pollingStationsApi.update(id || '', values);
          setSuccess('Polling station updated successfully!');
        } else {
          await pollingStationsApi.create(values);
          setSuccess('Polling station created successfully!');
          formik.resetForm();
        }
      } catch (err) {
        console.error('Failed to save polling station:', err);
        setError('Failed to save polling station. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
  });

  if (initialLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Button
        startIcon={<BackIcon />}
        onClick={() => navigate('/polling-stations')}
        sx={{ mb: 2 }}
      >
        Back to Polling Stations
      </Button>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          {isEditMode ? 'Edit Polling Station' : 'Create Polling Station'}
        </Typography>
        <Divider sx={{ mb: 3 }} />

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        <form onSubmit={formik.handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="name"
                name="name"
                label="Polling Station Name"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.name && Boolean(formik.errors.name)}
                helperText={formik.touched.name && formik.errors.name}
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                id="location"
                name="location"
                label="Location"
                value={formik.values.location}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.location && Boolean(formik.errors.location)}
                helperText={formik.touched.location && formik.errors.location}
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl 
                fullWidth
                error={formik.touched.constituencyId && Boolean(formik.errors.constituencyId)}
                disabled={loading}
              >
                <InputLabel id="constituency-label">Constituency</InputLabel>
                <Select
                  labelId="constituency-label"
                  id="constituencyId"
                  name="constituencyId"
                  value={formik.values.constituencyId}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  label="Constituency"
                >
                  {constituencies.map((constituency) => (
                    <MenuItem key={constituency.id} value={constituency.id}>
                      {constituency.name}
                    </MenuItem>
                  ))}
                </Select>
                {formik.touched.constituencyId && formik.errors.constituencyId && (
                  <FormHelperText>{formik.errors.constituencyId}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  disabled={loading}
                  sx={{ minWidth: 120 }}
                >
                  {loading ? <CircularProgress size={24} /> : isEditMode ? 'Update' : 'Create'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default CreatePollingStationForm;
