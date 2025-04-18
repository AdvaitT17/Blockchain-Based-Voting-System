import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Divider,
  Grid as MuiGrid,
  Chip,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  Card,
  CardContent
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  LocationOn as LocationIcon,
  HowToVote as VoteIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon
} from '@mui/icons-material';
import { pollingStationsApi } from '../../services/api';
import { PollingStation } from '../../types';
import { format } from 'date-fns';

// Create a Grid component that properly handles the 'item' prop
const Grid = (props: any) => <MuiGrid {...props} />;

const PollingStationDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [pollingStation, setPollingStation] = useState<PollingStation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPollingStationDetails();
    }
  }, [id]);

  const fetchPollingStationDetails = async () => {
    try {
      setLoading(true);
      const response = await pollingStationsApi.getById(id || '');
      setPollingStation(response.data.data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch polling station details:', err);
      setError('Failed to load polling station details. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async () => {
    if (!pollingStation) return;
    
    try {
      setStatusUpdateLoading(true);
      
      let response;
      if (pollingStation.status === 'ACTIVE') {
        response = await pollingStationsApi.deactivate(pollingStation.stationId);
      } else {
        response = await pollingStationsApi.activate(pollingStation.stationId);
      }
      
      setPollingStation(response.data.data);
      
    } catch (err) {
      console.error('Failed to update polling station status:', err);
      setError('Failed to update polling station status. Please try again later.');
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch (err) {
      return dateString;
    }
  };

  const getStatusChip = (status: string) => {
    if (status === 'ACTIVE') {
      return <Chip icon={<ActiveIcon />} label="Active" color="success" />;
    }
    return <Chip icon={<InactiveIcon />} label="Inactive" color="default" />;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!pollingStation) {
    return (
      <Box sx={{ mt: 2 }}>
        <Alert severity="error">
          Polling station not found or has been deleted.
        </Alert>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/polling-stations')}
          sx={{ mt: 2 }}
        >
          Back to Polling Stations
        </Button>
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" component="h1">
            {pollingStation.name}
          </Typography>
          <Box>
            <Button
              variant="outlined"
              color={pollingStation.status === 'ACTIVE' ? 'error' : 'success'}
              onClick={handleStatusChange}
              disabled={statusUpdateLoading}
              sx={{ mr: 1 }}
            >
              {statusUpdateLoading ? (
                <CircularProgress size={24} />
              ) : pollingStation.status === 'ACTIVE' ? (
                'Deactivate'
              ) : (
                'Activate'
              )}
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<EditIcon />}
              onClick={() => navigate(`/polling-stations/edit/${pollingStation.stationId}`)}
            >
              Edit
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Polling Station Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <List disablePadding>
                  <ListItem disablePadding sx={{ mb: 1 }}>
                    <ListItemText
                      primary="Status"
                      secondary={getStatusChip(pollingStation.status)}
                    />
                  </ListItem>
                  <ListItem disablePadding sx={{ mb: 1 }}>
                    <ListItemText
                      primary="Location"
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                          <LocationIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                          {pollingStation.location}
                        </Box>
                      }
                    />
                  </ListItem>
                  <ListItem disablePadding sx={{ mb: 1 }}>
                    <ListItemText
                      primary="Constituency"
                      secondary={pollingStation.constituencyName}
                    />
                  </ListItem>
                  <ListItem disablePadding sx={{ mb: 1 }}>
                    <ListItemText
                      primary="Created At"
                      secondary={formatDate(pollingStation.createdAt)}
                    />
                  </ListItem>
                  <ListItem disablePadding>
                    <ListItemText
                      primary="Last Updated"
                      secondary={formatDate(pollingStation.updatedAt)}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Voting Statistics
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <VoteIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                    <Typography variant="body1" color="text.secondary">
                      Voting statistics will be available during active elections.
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default PollingStationDetails;
