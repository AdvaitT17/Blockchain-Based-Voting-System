import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Container,
  Grid,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Divider,
  Tabs,
  Tab
} from '@mui/material';
import {
  HowToVote as VoteIcon,
  Visibility,
  VisibilityOff,
  PersonAdd as RegisterIcon
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useVoterAuth } from '../../contexts/VoterAuthContext';
import GridItem from '../common/GridItem';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`auth-tabpanel-${index}`}
      aria-labelledby={`auth-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, verifyVoter, registerVoter, loading, error } = useVoterAuth();
  const [showAadhar, setShowAadhar] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setRegistrationSuccess(false);
  };

  const loginValidationSchema = Yup.object({
    voterId: Yup.string()
      .required('Voter ID is required')
      .matches(/^[A-Z0-9]{3,10}$/, 'Invalid Voter ID format'),
    aadharNumber: Yup.string()
      .required('Aadhar Number is required')
      .matches(/^[0-9]{12}$/, 'Aadhar Number must be 12 digits')
  });

  const registrationValidationSchema = Yup.object({
    voterId: Yup.string()
      .required('Voter ID is required')
      .matches(/^[A-Z0-9]{3,10}$/, 'Invalid Voter ID format'),
    name: Yup.string()
      .required('Full Name is required')
      .min(3, 'Name must be at least 3 characters'),
    aadharId: Yup.string()
      .required('Aadhar Number is required')
      .matches(/^[0-9]{12}$/, 'Aadhar Number must be 12 digits'),
    votingDistrict: Yup.string()
      .required('Voting District is required')
  });

  const loginFormik = useFormik({
    initialValues: {
      voterId: '',
      aadharNumber: ''
    },
    validationSchema: loginValidationSchema,
    onSubmit: async (values) => {
      const success = await verifyVoter({
        voterId: values.voterId,
        aadharNumber: values.aadharNumber
      });
      
      if (success) {
        navigate('/');
      }
    }
  });

  const registrationFormik = useFormik({
    initialValues: {
      voterId: '',
      name: '',
      aadharId: '',
      votingDistrict: ''
    },
    validationSchema: registrationValidationSchema,
    onSubmit: async (values) => {
      const success = await registerVoter({
        voterId: values.voterId,
        name: values.name,
        aadharId: values.aadharId,
        votingDistrict: values.votingDistrict
      });
      
      if (success) {
        setRegistrationSuccess(true);
        // Reset form
        registrationFormik.resetForm();
      }
    }
  });

  const handleToggleAadharVisibility = () => {
    setShowAadhar(!showAadhar);
  };

  return (
    <Container component="main" maxWidth="sm" sx={{ mt: 8, mb: 8 }}>
      <Paper
        elevation={3}
        sx={{
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          borderRadius: 2
        }}
      >
        <Box
          sx={{
            mb: 3,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          <Box
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
              width: 64,
              height: 64,
              borderRadius: '50%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              mb: 2
            }}
          >
            <VoteIcon sx={{ fontSize: 36 }} />
          </Box>
          <Typography component="h1" variant="h5" align="center" gutterBottom>
            Blockchain Voting System
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center">
            Secure and transparent elections powered by blockchain
          </Typography>
        </Box>

        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          variant="fullWidth" 
          sx={{ borderBottom: 1, borderColor: 'divider', width: '100%' }}
        >
          <Tab label="Login" />
          <Tab label="Register" />
        </Tabs>

        {error && (
          <Alert severity="error" sx={{ width: '100%', mt: 3 }}>
            {error}
          </Alert>
        )}

        {registrationSuccess && (
          <Alert severity="success" sx={{ width: '100%', mt: 3 }}>
            Registration successful! You can now login with your credentials.
          </Alert>
        )}

        <TabPanel value={tabValue} index={0}>
          <Box component="form" onSubmit={loginFormik.handleSubmit} sx={{ width: '100%' }}>
            <Grid container spacing={2}>
              <GridItem xs={12}>
                <TextField
                  fullWidth
                  id="voterId"
                  name="voterId"
                  label="Voter ID"
                  value={loginFormik.values.voterId}
                  onChange={loginFormik.handleChange}
                  onBlur={loginFormik.handleBlur}
                  error={loginFormik.touched.voterId && Boolean(loginFormik.errors.voterId)}
                  helperText={loginFormik.touched.voterId && loginFormik.errors.voterId}
                  disabled={loading}
                  placeholder="Enter your Voter ID"
                  InputProps={{
                    sx: { borderRadius: 1 }
                  }}
                />
              </GridItem>
              <GridItem xs={12}>
                <TextField
                  fullWidth
                  id="aadharNumber"
                  name="aadharNumber"
                  label="Aadhar Number"
                  type={showAadhar ? 'text' : 'password'}
                  value={loginFormik.values.aadharNumber}
                  onChange={loginFormik.handleChange}
                  onBlur={loginFormik.handleBlur}
                  error={loginFormik.touched.aadharNumber && Boolean(loginFormik.errors.aadharNumber)}
                  helperText={loginFormik.touched.aadharNumber && loginFormik.errors.aadharNumber}
                  disabled={loading}
                  placeholder="Enter your 12-digit Aadhar Number"
                  InputProps={{
                    sx: { borderRadius: 1 },
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
              </GridItem>
            </Grid>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              disabled={loading}
              sx={{ mt: 3, mb: 2, py: 1.5, borderRadius: 1 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Login'}
            </Button>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box component="form" onSubmit={registrationFormik.handleSubmit} sx={{ width: '100%' }}>
            <Grid container spacing={2}>
              <GridItem xs={12}>
                <TextField
                  fullWidth
                  id="voterId"
                  name="voterId"
                  label="Voter ID"
                  value={registrationFormik.values.voterId}
                  onChange={registrationFormik.handleChange}
                  onBlur={registrationFormik.handleBlur}
                  error={registrationFormik.touched.voterId && Boolean(registrationFormik.errors.voterId)}
                  helperText={registrationFormik.touched.voterId && registrationFormik.errors.voterId}
                  disabled={loading}
                  placeholder="Enter your Voter ID"
                  InputProps={{
                    sx: { borderRadius: 1 }
                  }}
                />
              </GridItem>
              <GridItem xs={12}>
                <TextField
                  fullWidth
                  id="name"
                  name="name"
                  label="Full Name"
                  value={registrationFormik.values.name}
                  onChange={registrationFormik.handleChange}
                  onBlur={registrationFormik.handleBlur}
                  error={registrationFormik.touched.name && Boolean(registrationFormik.errors.name)}
                  helperText={registrationFormik.touched.name && registrationFormik.errors.name}
                  disabled={loading}
                  placeholder="Enter your full name"
                  InputProps={{
                    sx: { borderRadius: 1 }
                  }}
                />
              </GridItem>
              <GridItem xs={12}>
                <TextField
                  fullWidth
                  id="aadharId"
                  name="aadharId"
                  label="Aadhar Number"
                  type={showAadhar ? 'text' : 'password'}
                  value={registrationFormik.values.aadharId}
                  onChange={registrationFormik.handleChange}
                  onBlur={registrationFormik.handleBlur}
                  error={registrationFormik.touched.aadharId && Boolean(registrationFormik.errors.aadharId)}
                  helperText={registrationFormik.touched.aadharId && registrationFormik.errors.aadharId}
                  disabled={loading}
                  placeholder="Enter your 12-digit Aadhar Number"
                  InputProps={{
                    sx: { borderRadius: 1 },
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
              </GridItem>
              <GridItem xs={12}>
                <TextField
                  fullWidth
                  id="votingDistrict"
                  name="votingDistrict"
                  label="Voting District"
                  value={registrationFormik.values.votingDistrict}
                  onChange={registrationFormik.handleChange}
                  onBlur={registrationFormik.handleBlur}
                  error={registrationFormik.touched.votingDistrict && Boolean(registrationFormik.errors.votingDistrict)}
                  helperText={registrationFormik.touched.votingDistrict && registrationFormik.errors.votingDistrict}
                  disabled={loading}
                  placeholder="Enter your voting district (e.g., Mumbai North)"
                  InputProps={{
                    sx: { borderRadius: 1 }
                  }}
                />
              </GridItem>
            </Grid>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              disabled={loading}
              startIcon={<RegisterIcon />}
              sx={{ mt: 3, mb: 2, py: 1.5, borderRadius: 1 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Register'}
            </Button>
          </Box>
        </TabPanel>

        <Box sx={{ mt: 3, width: '100%' }}>
          <Alert severity="info">
            <Typography variant="body2">
              Your identity will be verified securely using blockchain technology. 
              Your personal information is hashed and never stored in plain text.
            </Typography>
          </Alert>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login;
