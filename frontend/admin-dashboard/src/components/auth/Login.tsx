import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Container,
  Grid,
  Link,
  Divider
} from '@mui/material';
import { HowToVote as VoteIcon, Lock as LockIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../../contexts/AuthContext';
import { LoginFormData } from '../../types';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validationSchema = Yup.object({
    username: Yup.string().required('Username is required'),
    password: Yup.string().required('Password is required')
  });

  const formik = useFormik<LoginFormData>({
    initialValues: {
      username: '',
      password: ''
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        setError(null);
        
        // In a real implementation, we would call the login API
        // For now, we'll simulate a successful login
        // await login(values);
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Store mock user data in localStorage
        const mockUser = {
          id: 'admin-1',
          username: values.username,
          role: 'ADMIN',
          organization: 'StateElectionOffice'
        };
        localStorage.setItem('token', 'mock-jwt-token');
        localStorage.setItem('user', JSON.stringify(mockUser));
        
        // Redirect to dashboard
        navigate('/dashboard');
      } catch (err: any) {
        console.error('Login failed:', err);
        setError(err.message || 'Login failed. Please check your credentials and try again.');
      } finally {
        setLoading(false);
      }
    }
  });

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          py: 4
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            borderRadius: 2
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
            <VoteIcon color="primary" sx={{ fontSize: 48, mb: 1 }} />
            <Typography component="h1" variant="h5" fontWeight="bold">
              Election Commission
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Admin Dashboard Login
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={formik.handleSubmit}>
            <TextField
              margin="normal"
              fullWidth
              id="username"
              label="Username"
              name="username"
              autoComplete="username"
              autoFocus
              value={formik.values.username}
              onChange={formik.handleChange}
              error={formik.touched.username && Boolean(formik.errors.username)}
              helperText={formik.touched.username && formik.errors.username}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="normal"
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={formik.values.password}
              onChange={formik.handleChange}
              error={formik.touched.password && Boolean(formik.errors.password)}
              helperText={formik.touched.password && formik.errors.password}
              sx={{ mb: 3 }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <LockIcon />}
              sx={{ mb: 2 }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <Divider sx={{ my: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Or
            </Typography>
          </Divider>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Button
                fullWidth
                variant="outlined"
                color="primary"
                onClick={() => {
                  formik.setFieldValue('username', 'admin');
                  formik.setFieldValue('password', 'admin123');
                }}
              >
                Use Demo Credentials
              </Button>
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Forgot your password?{' '}
              <Link href="#" variant="body2">
                Reset Password
              </Link>
            </Typography>
          </Box>
        </Paper>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
          © {new Date().getFullYear()} Election Commission of India. All rights reserved.
        </Typography>
      </Box>
    </Container>
  );
};

export default Login;
