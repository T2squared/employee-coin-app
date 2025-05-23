import React from 'react';
import { Navigate } from 'react-router-dom';
import { Box, Typography, CircularProgress, Button, Paper, Grid } from '@mui/material';
import { useAuth } from '../../hooks/useAuth';

const AdminSync: React.FC = () => {
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
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Google Sheets Sync Management
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Last Sync Status
        </Typography>
        <Typography variant="body1">
          Status information will be displayed here.
        </Typography>
        
        <Box sx={{ mt: 3 }}>
          <Button variant="contained" color="primary">
            Trigger Manual Sync
          </Button>
        </Box>
      </Paper>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Export Configuration
            </Typography>
            <Typography variant="body1">
              Export configuration interface will be implemented here.
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Import Configuration
            </Typography>
            <Typography variant="body1">
              Import configuration interface will be implemented here.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminSync;
