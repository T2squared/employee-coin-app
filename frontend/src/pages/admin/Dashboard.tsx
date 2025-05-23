import React from 'react';
import { Navigate } from 'react-router-dom';
import { Box, Typography, Grid, Paper, CircularProgress } from '@mui/material';
import { useAuth } from '../../hooks/useAuth';

const AdminDashboard: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    return <Navigate to="/login" />;
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6} lg={3}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Total Supply
            </Typography>
            <Typography component="p" variant="h4">
              Loading...
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6} lg={3}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Coins in Circulation
            </Typography>
            <Typography component="p" variant="h4">
              Loading...
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6} lg={3}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Unallocated Supply
            </Typography>
            <Typography component="p" variant="h4">
              Loading...
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6} lg={3}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Active Users
            </Typography>
            <Typography component="p" variant="h4">
              Loading...
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 240 }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Top Recipients
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Data will be loaded here
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 240 }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Top Givers
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Data will be loaded here
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Recent Transactions
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Transaction data will be loaded here
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard;
