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
  CircularProgress,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { candidatesApi, electionsApi } from '../../services/api';
import { Candidate, Election } from '../../types';

const CandidatesList: React.FC = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedElection, setSelectedElection] = useState<string>('all');
  const navigate = useNavigate();

  useEffect(() => {
    fetchElections();
  }, []);

  const fetchElections = async () => {
    try {
      setLoading(true);
      const response = await electionsApi.getAll();
      setElections(response.data.data);
      
      // After fetching elections, fetch all candidates
      await fetchAllCandidates();
    } catch (err) {
      console.error('Failed to fetch elections:', err);
      setError('Failed to load elections. Please try again later.');
      setLoading(false);
    }
  };

  const fetchAllCandidates = async () => {
    try {
      // In a real implementation, we would have an API endpoint to get all candidates
      // For now, we'll fetch candidates for each election and combine them
      const allCandidates: Candidate[] = [];
      
      for (const election of elections) {
        try {
          const response = await candidatesApi.getByElection(election.electionId);
          const electionCandidates = response.data.data.map((candidate: Candidate) => ({
            ...candidate,
            electionName: election.name // Add election name for display
          }));
          allCandidates.push(...electionCandidates);
        } catch (err) {
          console.error(`Failed to fetch candidates for election ${election.electionId}:`, err);
        }
      }
      
      setCandidates(allCandidates);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch candidates:', err);
      setError('Failed to load candidates. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCandidatesByElection = async (electionId: string) => {
    try {
      setLoading(true);
      const response = await candidatesApi.getByElection(electionId);
      const election = elections.find(e => e.electionId === electionId);
      const electionCandidates = response.data.data.map((candidate: Candidate) => ({
        ...candidate,
        electionName: election?.name || 'Unknown Election'
      }));
      setCandidates(electionCandidates);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch candidates:', err);
      setError('Failed to load candidates. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCandidate = () => {
    navigate('/candidates/create');
  };

  const handleViewElection = (electionId: string) => {
    navigate(`/elections/${electionId}`);
  };

  const handleElectionChange = (event: SelectChangeEvent) => {
    const value = event.target.value;
    setSelectedElection(value);
    
    if (value === 'all') {
      fetchAllCandidates();
    } else {
      fetchCandidatesByElection(value);
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const filteredCandidates = candidates.filter(candidate => 
    candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    candidate.partyId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    candidate.constituencyId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && candidates.length === 0) {
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
          Candidates
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleCreateCandidate}
        >
          Register Candidate
        </Button>
      </Box>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <Box sx={{ display: 'flex', mb: 3, gap: 2 }}>
        <TextField
          label="Search Candidates"
          variant="outlined"
          fullWidth
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="election-filter-label">Filter by Election</InputLabel>
          <Select
            labelId="election-filter-label"
            id="election-filter"
            value={selectedElection}
            onChange={handleElectionChange}
            label="Filter by Election"
          >
            <MenuItem value="all">All Elections</MenuItem>
            {elections.map((election) => (
              <MenuItem key={election.electionId} value={election.electionId}>
                {election.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Party</TableCell>
              <TableCell>Constituency</TableCell>
              <TableCell>Election</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCandidates.length > 0 ? (
              filteredCandidates.map((candidate) => (
                <TableRow key={candidate.candidateId}>
                  <TableCell>{candidate.name}</TableCell>
                  <TableCell>{candidate.partyId}</TableCell>
                  <TableCell>{candidate.constituencyId}</TableCell>
                  <TableCell>
                    {(candidate as any).electionName || 'Unknown Election'}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      color="primary"
                      onClick={() => handleViewElection(candidate.electionId)}
                      size="small"
                    >
                      <ViewIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  {loading ? (
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                  ) : (
                    'No candidates found. Register your first candidate!'
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default CandidatesList;
