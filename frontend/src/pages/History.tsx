import React from 'react';
import { Navigate } from 'react-router-dom';
import TransactionHistory from '../components/TransactionHistory';
import { useAuth } from '../hooks/useAuth';

const History: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <TransactionHistory />;
};

export default History;
