import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Grid, 
  Paper, 
  Typography, 
  Button,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  Badge,
  IconButton,
  Tabs,
  Tab
} from '@mui/material';
import { 
  Notifications as NotificationsIcon,
  Send as SendIcon,
  History as HistoryIcon,
  Dashboard as DashboardIcon
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import TransactionForm from './TransactionForm';
import TransactionHistory from './TransactionHistory';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';

interface Transaction {
  id: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  recipientName: string;
  amount: number;
  reason: string;
  transactionTime: string;
}

interface Notification {
  id: string;
  type: 'TRANSACTION_RECEIVED';
  read: boolean;
  data: any;
  createdAt: string;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [remainingTransactions, setRemainingTransactions] = useState(3);

  useEffect(() => {
    const socketInstance = io(process.env.REACT_APP_API_URL || 'http://localhost:8000', {
      auth: {
        token: localStorage.getItem('token')
      }
    });

    socketInstance.on('connect', () => {
      console.log('Connected to WebSocket');
      socketInstance.emit('join', user?.id);
    });

    socketInstance.on('transaction_received', (transaction) => {
      const newNotification = {
        id: `notification-${Date.now()}`,
        type: 'TRANSACTION_RECEIVED',
        read: false,
        data: transaction,
        createdAt: new Date().toISOString()
      };
      
      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      fetchTransactions();
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [user?.id]);

  useEffect(() => {
    fetchTransactions();
    fetchNotifications();
    fetchRemainingTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await axios.get('/api/transactions/recent', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setTransactions(response.data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await axios.get('/api/users/notifications', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setNotifications(response.data);
      setUnreadCount(response.data.filter((n: Notification) => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchRemainingTransactions = async () => {
    try {
      const response = await axios.get('/api/transactions/remaining-today', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setRemainingTransactions(response.data.remaining);
    } catch (error) {
      console.error('Error fetching remaining transactions:', error);
    }
  };

  const markNotificationsAsRead = async () => {
    try {
      await axios.post('/api/users/notifications/mark-read', {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const handleTransactionSuccess = () => {
    setShowTransactionForm(false);
    fetchTransactions();
    fetchRemainingTransactions();
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        {/* Header */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h4" component="h1">
              Employee Dashboard
            </Typography>
            <Box>
              <IconButton 
                color="inherit" 
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  if (!showNotifications) {
                    markNotificationsAsRead();
                  }
                }}
              >
                <Badge badgeContent={unreadCount} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Box>
          </Box>
        </Grid>

        {/* Notifications Panel */}
        {showNotifications && (
          <Grid item xs={12}>
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Notifications
              </Typography>
              {notifications.length === 0 ? (
                <Typography variant="body2" color="textSecondary">
                  No notifications
                </Typography>
              ) : (
                <List>
                  {notifications.map((notification) => (
                    <React.Fragment key={notification.id}>
                      <ListItem alignItems="flex-start">
                        <ListItemText
                          primary={
                            notification.type === 'TRANSACTION_RECEIVED' 
                              ? `You received ${notification.data.amount} K-Points from ${notification.data.senderName}`
                              : 'New notification'
                          }
                          secondary={
                            <>
                              <Typography component="span" variant="body2" color="textPrimary">
                                {notification.data.reason}
                              </Typography>
                              {` — ${new Date(notification.createdAt).toLocaleString()}`}
                            </>
                          }
                        />
                      </ListItem>
                      <Divider component="li" />
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Paper>
          </Grid>
        )}

        {/* Balance Card */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 200 }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Current Balance
            </Typography>
            <Typography component="p" variant="h3" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {user?.currentBalance || 0}
            </Typography>
            <Typography color="text.secondary" sx={{ flex: 1 }}>
              K-Points
            </Typography>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Remaining today: {remainingTransactions} transfers
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<SendIcon />}
                onClick={() => setShowTransactionForm(true)}
                disabled={remainingTransactions === 0}
              >
                Give K-Points
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Recent Transactions */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabValue} onChange={handleTabChange} aria-label="transaction tabs">
                <Tab label="Dashboard" icon={<DashboardIcon />} />
                <Tab label="Transaction History" icon={<HistoryIcon />} />
              </Tabs>
            </Box>
            
            {tabValue === 0 && (
              <>
                <Typography component="h2" variant="h6" color="primary" gutterBottom sx={{ mt: 2 }}>
                  Recent Transactions
                </Typography>
                {transactions.length === 0 ? (
                  <Typography variant="body2" color="textSecondary" sx={{ p: 2 }}>
                    No recent transactions
                  </Typography>
                ) : (
                  <List>
                    {transactions.slice(0, 5).map((transaction) => (
                      <React.Fragment key={transaction.id}>
                        <ListItem alignItems="flex-start">
                          <ListItemText
                            primary={
                              transaction.senderId === user?.id
                                ? `You sent ${transaction.amount} K-Points to ${transaction.recipientName}`
                                : `You received ${transaction.amount} K-Points from ${transaction.senderName}`
                            }
                            secondary={
                              <>
                                <Typography component="span" variant="body2" color="textPrimary">
                                  {transaction.reason}
                                </Typography>
                                {` — ${new Date(transaction.transactionTime).toLocaleString()}`}
                              </>
                            }
                          />
                        </ListItem>
                        <Divider component="li" />
                      </React.Fragment>
                    ))}
                  </List>
                )}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Button 
                    color="primary" 
                    onClick={() => setTabValue(1)}
                  >
                    View All
                  </Button>
                </Box>
              </>
            )}
            
            {tabValue === 1 && (
              <TransactionHistory />
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Transaction Form Dialog */}
      {showTransactionForm && (
        <TransactionForm 
          open={showTransactionForm} 
          onClose={() => setShowTransactionForm(false)}
          onSuccess={handleTransactionSuccess}
        />
      )}
    </Container>
  );
};

export default Dashboard;
