import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Paper, 
  Container,
  Link,
  Alert
} from '@mui/material';
import { useAuth } from '../hooks/useAuth';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    
    try {
      await login(email, password);
    } catch (error: any) {
      setLoginError(error.response?.data?.message || 'Login failed. Please try again.');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: resetEmail }),
      });
      
      if (response.ok) {
        setResetSent(true);
      } else {
        const data = await response.json();
        setResetError(data.message || 'Password reset failed. Please try again.');
      }
    } catch (error) {
      setResetError('Password reset failed. Please try again.');
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          {!showForgotPassword ? (
            <>
              <Typography component="h1" variant="h5" align="center" gutterBottom>
                Employee K-Point App Login
              </Typography>
              
              {loginError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {loginError}
                </Alert>
              )}
              
              <Box component="form" onSubmit={handleLogin} sx={{ mt: 1 }}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  name="email"
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type="password"
                  id="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2 }}
                >
                  Sign In
                </Button>
                <Box sx={{ textAlign: 'center' }}>
                  <Link 
                    href="#" 
                    variant="body2" 
                    onClick={(e) => {
                      e.preventDefault();
                      setShowForgotPassword(true);
                    }}
                  >
                    Forgot password?
                  </Link>
                </Box>
              </Box>
            </>
          ) : (
            <>
              <Typography component="h1" variant="h5" align="center" gutterBottom>
                Reset Password
              </Typography>
              
              {resetError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {resetError}
                </Alert>
              )}
              
              {resetSent ? (
                <Alert severity="success" sx={{ mb: 2 }}>
                  If your email is registered, you will receive a password reset link.
                </Alert>
              ) : (
                <Box component="form" onSubmit={handleResetPassword} sx={{ mt: 1 }}>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="reset-email"
                    label="Email Address"
                    name="email"
                    autoComplete="email"
                    autoFocus
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                  />
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    sx={{ mt: 3, mb: 2 }}
                  >
                    Send Reset Link
                  </Button>
                </Box>
              )}
              
              <Box sx={{ textAlign: 'center' }}>
                <Link 
                  href="#" 
                  variant="body2" 
                  onClick={(e) => {
                    e.preventDefault();
                    setShowForgotPassword(false);
                    setResetSent(false);
                    setResetError(null);
                  }}
                >
                  Back to login
                </Link>
              </Box>
            </>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;
