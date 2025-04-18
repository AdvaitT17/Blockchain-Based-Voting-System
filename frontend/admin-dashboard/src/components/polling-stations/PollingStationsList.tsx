import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  IconButton,
  Grid as MuiGrid,
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon
} from '@mui/icons-material';
import { pollingStationsApi } from '../../services/api';
import { PollingStation } from '../../types';

// Create a Grid component that properly handles the 'item' prop
const Grid = (props: any) => <MuiGrid {...props} />;

const PollingStationsList: React.FC = () => {
  const navigate = useNavigate();
  const [pollingStations, setPollingStations] = useState<PollingStation[]>([]);
  const [filteredStations, setFilteredStations] = useState<PollingStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConstituency, setSelectedConstituency] = useState<string>('all');
  const [constituencies, setConstituencies] = useState<{ id: string, name: string }[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [stationToDelete, setStationToDelete] = useState<PollingStation | null>(null);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchPollingStations();
  }, []);

  useEffect(() => {
    filterStations();
  }, [searchTerm, selectedConstituency, pollingStations]);

  const fetchPollingStations = async () => {
    try {
      setLoading(true);
      const response = await pollingStationsApi.getAll();
      const stationsData = response.data.data;
      setPollingStations(stationsData);
      
      // Extract unique constituencies
      const uniqueConstituencies = new Map<string, { id: string, name: string }>();
      stationsData.forEach((station: PollingStation) => {
        uniqueConstituencies.set(station.constituencyId, {
          id: station.constituencyId,
          name: station.constituencyName
        });
      });
      
      setConstituencies(Array.from(uniqueConstituencies.values()));
      setError(null);
    } catch (err) {
      console.error('Failed to fetch polling stations:', err);
      setError('Failed to load polling stations. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const filterStations = () => {
    let filtered = [...pollingStations];
    
    // Filter by constituency
    if (selectedConstituency !== 'all') {
      filtered = filtered.filter(station => station.constituencyId === selectedConstituency);
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        station => 
          station.name.toLowerCase().includes(term) ||
          station.location.toLowerCase().includes(term) ||
          station.constituencyName.toLowerCase().includes(term)
      );
    }
    
    setFilteredStations(filtered);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleConstituencyChange = (constituencyId: string) => {
    setSelectedConstituency(constituencyId);
  };

  const handleDeleteClick = (station: PollingStation) => {
    setStationToDelete(station);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!stationToDelete) return;
    
    try {
      await pollingStationsApi.delete(stationToDelete.stationId);
      setPollingStations(pollingStations.filter(s => s.stationId !== stationToDelete.stationId));
      setDeleteDialogOpen(false);
      setStationToDelete(null);
    } catch (err) {
      console.error('Failed to delete polling station:', err);
      setError('Failed to delete polling station. Please try again later.');
    }
  };

  const handleStatusChange = async (station: PollingStation) => {
    try {
      setStatusUpdateLoading(station.stationId);
      
      let response;
      if (station.status === 'ACTIVE') {
        response = await pollingStationsApi.deactivate(station.stationId);
      } else {
        response = await pollingStationsApi.activate(station.stationId);
      }
      
      const updatedStation = response.data.data;
      
      setPollingStations(pollingStations.map(s => 
        s.stationId === updatedStation.stationId ? updatedStation : s
      ));
      
    } catch (err) {
      console.error('Failed to update polling station status:', err);
      setError('Failed to update polling station status. Please try again later.');
    } finally {
      setStatusUpdateLoading(null);
    }
  };

  const getStatusChip = (status: string) => {
    if (status === 'ACTIVE') {
      return <Chip icon={<ActiveIcon />} label="Active" color="success" size="small" />;
    }
    return <Chip icon={<InactiveIcon />} label="Inactive" color="default" size="small" />;
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h1">
          Polling Stations
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => navigate('/polling-stations/create')}
        >
          Add Polling Station
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search by name, location or constituency"
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
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Chip
                label="All Constituencies"
                color={selectedConstituency === 'all' ? 'primary' : 'default'}
                onClick={() => handleConstituencyChange('all')}
                sx={{ mb: 1 }}
              />
              {constituencies.map((constituency) => (
                <Chip
                  key={constituency.id}
                  label={constituency.name}
                  color={selectedConstituency === constituency.id ? 'primary' : 'default'}
                  onClick={() => handleConstituencyChange(constituency.id)}
                  sx={{ mb: 1 }}
                />
              ))}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Constituency</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredStations.length > 0 ? (
              filteredStations.map((station) => (
                <TableRow key={station.stationId}>
                  <TableCell>{station.name}</TableCell>
                  <TableCell>{station.location}</TableCell>
                  <TableCell>{station.constituencyName}</TableCell>
                  <TableCell>
                    {getStatusChip(station.status)}
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Tooltip title={station.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}>
                        <IconButton
                          color={station.status === 'ACTIVE' ? 'default' : 'success'}
                          onClick={() => handleStatusChange(station)}
                          disabled={statusUpdateLoading === station.stationId}
                        >
                          {statusUpdateLoading === station.stationId ? (
                            <CircularProgress size={24} />
                          ) : station.status === 'ACTIVE' ? (
                            <InactiveIcon />
                          ) : (
                            <ActiveIcon />
                          )}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton
                          color="primary"
                          onClick={() => navigate(`/polling-stations/edit/${station.stationId}`)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          color="error"
                          onClick={() => handleDeleteClick(station)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography variant="body1" sx={{ py: 2 }}>
                    {searchTerm || selectedConstituency !== 'all'
                      ? 'No polling stations match your search criteria.'
                      : 'No polling stations found. Add a new polling station to get started.'}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the polling station "{stationToDelete?.name}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PollingStationsList;
