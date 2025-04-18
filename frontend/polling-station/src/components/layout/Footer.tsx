import React from 'react';
import { Box, Container, Typography, Link, Divider } from '@mui/material';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: (theme) => theme.palette.grey[100],
      }}
    >
      <Divider sx={{ mb: 3 }} />
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'center', md: 'flex-start' } }}>
          <Box sx={{ mb: { xs: 2, md: 0 }, textAlign: { xs: 'center', md: 'left' } }}>
            <Typography variant="h6" color="text.primary" gutterBottom>
              Polling Station Interface
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Secure, transparent, and verifiable elections powered by blockchain technology.
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', textAlign: { xs: 'center', md: 'right' } }}>
            <Typography variant="body2" color="text.secondary">
              © {currentYear} Election Commission of India
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <Link href="#" color="inherit" sx={{ mr: 1 }}>
                Privacy Policy
              </Link>
              |
              <Link href="#" color="inherit" sx={{ mx: 1 }}>
                Terms of Service
              </Link>
              |
              <Link href="#" color="inherit" sx={{ ml: 1 }}>
                Help
              </Link>
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
