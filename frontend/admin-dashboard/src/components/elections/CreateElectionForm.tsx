import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  FormHelperText
} from '@mui/material';
import { Add as AddIcon, Close as CloseIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { electionsApi } from '../../services/api';
import { ElectionFormData } from '../../types';

const CreateElectionForm: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newConstituency, setNewConstituency] = useState('');

  const validationSchema = Yup.object({
    name: Yup.string().required('Election name is required'),
    startTime: Yup.date().required('Start time is required'),
    endTime: Yup.date()
      .required('End time is required')
      .min(Yup.ref('startTime'), 'End time must be after start time'),
    constituencies: Yup.array()
      .of(Yup.string())
      .min(1, 'At least one constituency is required')
  });

  const formik = useFormik<ElectionFormData>({
    initialValues: {
      name: '',
      startTime: '',
      endTime: '',
      constituencies: []
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        setError(null);
        await electionsApi.create(values);
        navigate('/elections');
      } catch (err: any) {
        console.error('Failed to create election:', err);
        setError(err.response?.data?.message || 'Failed to create election. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  });

  const handleAddConstituency = () => {
    if (newConstituency.trim() && !formik.values.constituencies.includes(newConstituency.trim())) {
      formik.setFieldValue('constituencies', [...formik.values.constituencies, newConstituency.trim()]);
      setNewConstituency('');
    }
  };

  const handleRemoveConstituency = (constituency: string) => {
    formik.setFieldValue(
      'constituencies',
      formik.values.constituencies.filter((c) => c !== constituency)
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddConstituency();
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" component="h1">
          Create New Election
        </Typography>
        <Button variant="outlined" color="primary" onClick={() => navigate('/elections')}>
          Back to Elections
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
                label="Election Name"
                variant="outlined"
                value={formik.values.name}
                onChange={formik.handleChange}
                error={formik.touched.name && Boolean(formik.errors.name)}
                helperText={formik.touched.name && formik.errors.name}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="startTime"
                name="startTime"
                label="Start Time"
                type="datetime-local"
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                value={formik.values.startTime}
                onChange={formik.handleChange}
                error={formik.touched.startTime && Boolean(formik.errors.startTime)}
                helperText={formik.touched.startTime && formik.errors.startTime}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="endTime"
                name="endTime"
                label="End Time"
                type="datetime-local"
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                value={formik.values.endTime}
                onChange={formik.handleChange}
                error={formik.touched.endTime && Boolean(formik.errors.endTime)}
                helperText={formik.touched.endTime && formik.errors.endTime}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Constituencies
              </Typography>
              <Box sx={{ display: 'flex', mb: 1 }}>
                <TextField
                  fullWidth
                  id="newConstituency"
                  label="Add Constituency"
                  variant="outlined"
                  value={newConstituency}
                  onChange={(e) => setNewConstituency(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={handleAddConstituency}
                  sx={{ ml: 1 }}
                >
                  Add
                </Button>
              </Box>
              {formik.touched.constituencies && formik.errors.constituencies && (
                <FormHelperText error>{formik.errors.constituencies as string}</FormHelperText>
              )}

              <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {formik.values.constituencies.map((constituency) => (
                  <Chip
                    key={constituency}
                    label={constituency}
                    onDelete={() => handleRemoveConstituency(constituency)}
                    deleteIcon={<CloseIcon />}
                  />
                ))}
                {formik.values.constituencies.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    No constituencies added yet. Add at least one constituency.
                  </Typography>
                )}
              </Box>
            </Grid>

            <Grid item xs={12} sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => navigate('/elections')}
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
                  {loading ? 'Creating...' : 'Create Election'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default CreateElectionForm;
