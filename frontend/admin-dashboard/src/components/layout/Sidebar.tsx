import React from 'react';
import { 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Divider, 
  Box, 
  Typography 
} from '@mui/material';
import { 
  Dashboard as DashboardIcon, 
  HowToVote as ElectionIcon, 
  People as CandidateIcon, 
  LocationOn as PollingStationIcon, 
  Assessment as ResultsIcon, 
  ExitToApp as LogoutIcon 
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const drawerWidth = 240;

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Elections', icon: <ElectionIcon />, path: '/elections' },
    { text: 'Candidates', icon: <CandidateIcon />, path: '/candidates' },
    { text: 'Polling Stations', icon: <PollingStationIcon />, path: '/polling-stations' },
    { text: 'Results', icon: <ResultsIcon />, path: '/results' },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: '#1a237e',
          color: 'white',
        },
      }}
    >
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', my: 2 }}>
          Election Commission
        </Typography>
        <Typography variant="subtitle2">Admin Dashboard</Typography>
      </Box>
      <Divider sx={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
      <List>
        {menuItems.map((item) => (
          <ListItem 
            button 
            key={item.text} 
            onClick={() => handleNavigation(item.path)}
            sx={{ 
              backgroundColor: location.pathname === item.path ? 'rgba(255,255,255,0.1)' : 'transparent',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.1)',
              },
              borderLeft: location.pathname === item.path ? '4px solid #fff' : 'none',
              pl: location.pathname === item.path ? 1.75 : 2,
            }}
          >
            <ListItemIcon sx={{ color: 'white' }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
      <Box sx={{ flexGrow: 1 }} />
      <Divider sx={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
      <List>
        <ListItem button onClick={handleLogout}>
          <ListItemIcon sx={{ color: 'white' }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItem>
      </List>
    </Drawer>
  );
};

export default Sidebar;
