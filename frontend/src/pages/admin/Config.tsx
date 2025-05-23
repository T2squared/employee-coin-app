import React from 'react';
import { Navigate } from 'react-router-dom';
import { Box, Typography, CircularProgress } from '@mui/material';
import { useAuth } from '../../hooks/useAuth';

const AdminConfig: React.FC = () => {
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
        System Configuration
      </Typography>
      <Typography variant="body1">
        System configuration interface will be implemented here.
      </Typography>
    </Box>
  );
};

export default AdminConfig;
