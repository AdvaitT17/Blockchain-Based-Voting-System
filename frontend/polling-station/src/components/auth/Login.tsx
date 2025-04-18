import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Container,
  Grid as MuiGrid,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Divider
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useStationAuth } from '../../contexts/StationAuthContext';

// Create a Grid component that properly handles the 'item' prop
const Grid = (props: any) => <MuiGrid {...props} />;

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, login, loading, error } = useStationAuth();
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const validationSchema = Yup.object({
    stationId: Yup.string()
      .required('Station ID is required'),
    password: Yup.string()
      .required('Password is required')
  });

  const formik = useFormik({
    initialValues: {
      stationId: '',
      password: ''
    },
    validationSchema,
    onSubmit: async (values) => {
      const success = await login({
        stationId: values.stationId,
        password: values.password
      });
      
      if (success) {
        navigate('/');
      }
    }
  });

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
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
            <LocationIcon sx={{ fontSize: 36 }} />
          </Box>
          <Typography component="h1" variant="h5" align="center" gutterBottom>
            Polling Station Login
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center">
            Enter your Station ID and password to access the polling station interface
          </Typography>
        </Box>

        <Divider sx={{ width: '100%', mb: 3 }} />

        {error && (
          <Alert severity="error" sx={{ width: '100%', mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={formik.handleSubmit} sx={{ width: '100%' }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="stationId"
                name="stationId"
                label="Station ID"
                value={formik.values.stationId}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.stationId && Boolean(formik.errors.stationId)}
                helperText={formik.touched.stationId && formik.errors.stationId}
                disabled={loading}
                placeholder="Enter your Station ID"
                InputProps={{
                  sx: { borderRadius: 1 }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="password"
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.password && Boolean(formik.errors.password)}
                helperText={formik.touched.password && formik.errors.password}
                disabled={loading}
                placeholder="Enter your password"
                InputProps={{
                  sx: { borderRadius: 1 },
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleTogglePasswordVisibility}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
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

        <Box sx={{ mt: 3, width: '100%' }}>
          <Alert severity="info">
            <Typography variant="body2">
              This interface is only for authorized polling officials. 
              If you are a voter, please use the Voter Portal.
            </Typography>
          </Alert>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login;
