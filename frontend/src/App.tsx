import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Container } from '@mui/material';
import { AuthProvider } from './context/AuthContext';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminDepartments from './pages/admin/Departments';
import AdminConfig from './pages/admin/Config';
import AdminTransactions from './pages/admin/Transactions';
import AdminSync from './pages/admin/Sync';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            
            {/* Employee routes */}
            <Route path="/" element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/history" element={<History />} />
            </Route>
            
            {/* Admin routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="departments" element={<AdminDepartments />} />
              <Route path="config" element={<AdminConfig />} />
              <Route path="transactions" element={<AdminTransactions />} />
              <Route path="sync" element={<AdminSync />} />
            </Route>
            
            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
