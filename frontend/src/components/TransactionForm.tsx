import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Autocomplete,
  Box,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';
import axios from 'axios';

interface User {
  id: string;
  name: string;
  email: string;
  departmentName?: string;
}

interface TransactionFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ open, onClose, onSuccess }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fixedAmount, setFixedAmount] = useState(3);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (open) {
      fetchUsers();
      fetchConfig();
    }
  }, [open]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await axios.get('/api/users/active', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchConfig = async () => {
    try {
      const response = await axios.get('/api/config/FixedCoinPerTx', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.data && response.data.value) {
        setFixedAmount(parseInt(response.data.value, 10));
      }
    } catch (error) {
      console.error('Error fetching config:', error);
    }
  };

  const handleSubmit = async () => {
    if (!selectedUser) {
      setError('Please select a recipient');
      return;
    }

    if (!reason || reason.length < 10 || reason.length > 200) {
      setError('Please provide a reason between 10 and 200 characters');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await axios.post('/api/transactions', {
        recipientId: selectedUser.id,
        reason
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      onSuccess();
    } catch (error: any) {
      console.error('Error creating transaction:', error);
      setError(error.response?.data?.message || 'Failed to send K-Points. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedUser(null);
    setReason('');
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Give K-Points</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box sx={{ my: 2 }}>
          <Autocomplete
            options={users}
            getOptionLabel={(option) => `${option.name} (${option.email})${option.departmentName ? ` - ${option.departmentName}` : ''}`}
            loading={loadingUsers}
            value={selectedUser}
            onChange={(event, newValue) => {
              setSelectedUser(newValue);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Recipient"
                required
                fullWidth
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loadingUsers ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
        </Box>
        
        <Box sx={{ my: 2 }}>
          <TextField
            label="Amount"
            value={fixedAmount}
            disabled
            fullWidth
            helperText="Fixed amount per transaction"
          />
        </Box>
        
        <Box sx={{ my: 2 }}>
          <TextField
            label="Reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            fullWidth
            multiline
            rows={4}
            inputProps={{ minLength: 10, maxLength: 200 }}
            helperText={`${reason.length}/200 characters (min 10)`}
            error={reason.length > 0 && (reason.length < 10 || reason.length > 200)}
          />
        </Box>
        
        <Typography variant="body2" color="textSecondary">
          You are about to send {fixedAmount} K-Points to the selected recipient.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          color="primary" 
          variant="contained"
          disabled={loading || !selectedUser || reason.length < 10 || reason.length > 200}
        >
          {loading ? <CircularProgress size={24} /> : 'Send'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TransactionForm;
