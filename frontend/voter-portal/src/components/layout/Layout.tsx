import React, { ReactNode } from 'react';
import { Box, Container, CssBaseline, Paper } from '@mui/material';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        bgcolor: '#f5f5f5'
      }}
    >
      <CssBaseline />
      <Header />
      <Container component="main" maxWidth="lg" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
        <Paper
          elevation={2}
          sx={{
            p: { xs: 2, md: 4 },
            borderRadius: 2,
            bgcolor: 'white'
          }}
        >
          {children}
        </Paper>
      </Container>
      <Footer />
    </Box>
  );
};

export default Layout;
