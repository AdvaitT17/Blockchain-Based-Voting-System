import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  IconButton,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  PlayArrow as StartIcon,
  Stop as EndIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { electionsApi } from '../../services/api';
import { Election } from '../../types';
import { format } from 'date-fns';

const ElectionsList: React.FC = () => {
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchElections();
  }, []);

  const fetchElections = async () => {
    try {
      setLoading(true);
      const response = await electionsApi.getAll();
      setElections(response.data.data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch elections:', err);
      setError('Failed to load elections. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateElection = () => {
    navigate('/elections/create');
  };

  const handleViewElection = (id: string) => {
    navigate(`/elections/${id}`);
  };

  const handleStartElection = async (id: string) => {
    try {
      await electionsApi.start(id);
      fetchElections(); // Refresh the list
    } catch (err) {
      console.error('Failed to start election:', err);
      setError('Failed to start election. Please try again later.');
    }
  };

  const handleEndElection = async (id: string) => {
    try {
      await electionsApi.end(id);
      fetchElections(); // Refresh the list
    } catch (err) {
      console.error('Failed to end election:', err);
      setError('Failed to end election. Please try again later.');
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
    
    return <Chip label={status} color={color} size="small" />;
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch (err) {
      return dateString;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" component="h1">
          Elections
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleCreateElection}
        >
          Create Election
        </Button>
      </Box>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Start Time</TableCell>
              <TableCell>End Time</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Constituencies</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {elections.length > 0 ? (
              elections.map((election) => (
                <TableRow key={election.electionId}>
                  <TableCell>{election.name}</TableCell>
                  <TableCell>{formatDate(election.startTime)}</TableCell>
                  <TableCell>{formatDate(election.endTime)}</TableCell>
                  <TableCell>{getStatusChip(election.status)}</TableCell>
                  <TableCell>{election.constituencies.length}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      color="primary"
                      onClick={() => handleViewElection(election.electionId)}
                      size="small"
                    >
                      <ViewIcon />
                    </IconButton>
                    {election.status === 'UPCOMING' && (
                      <IconButton
                        color="success"
                        onClick={() => handleStartElection(election.electionId)}
                        size="small"
                      >
                        <StartIcon />
                      </IconButton>
                    )}
                    {election.status === 'ACTIVE' && (
                      <IconButton
                        color="error"
                        onClick={() => handleEndElection(election.electionId)}
                        size="small"
                      >
                        <EndIcon />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No elections found. Create your first election!
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ElectionsList;
