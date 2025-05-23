import React from 'react';
import { Navigate } from 'react-router-dom';
import DashboardComponent from '../components/Dashboard';
import { useAuth } from '../hooks/useAuth';

const Dashboard: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return <DashboardComponent />;
};

export default Dashboard;
