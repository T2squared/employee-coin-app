import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  TextField,
  MenuItem,
  Button,
  Grid,
  CircularProgress,
  Chip
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useAuth } from '../hooks/useAuth';
import axios from 'axios';

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

const TransactionHistory: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState({
    type: 'all',
    startDate: null as Date | null,
    endDate: null as Date | null,
    keyword: ''
  });

  useEffect(() => {
    fetchTransactions();
  }, [page, rowsPerPage, filters]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: page + 1,
        limit: rowsPerPage
      };

      if (filters.type !== 'all') {
        params.type = filters.type;
      }

      if (filters.startDate) {
        params.startDate = filters.startDate.toISOString();
      }

      if (filters.endDate) {
        params.endDate = filters.endDate.toISOString();
      }

      if (filters.keyword) {
        params.keyword = filters.keyword;
      }

      const response = await axios.get('/api/transactions', {
        params,
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      setTransactions(response.data.transactions);
      setTotalCount(response.data.pagination.total);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (name: string, value: any) => {
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(0);
  };

  const handleExport = async () => {
    try {
      const params: any = {};

      if (filters.type !== 'all') {
        params.type = filters.type;
      }

      if (filters.startDate) {
        params.startDate = filters.startDate.toISOString();
      }

      if (filters.endDate) {
        params.endDate = filters.endDate.toISOString();
      }

      if (filters.keyword) {
        params.keyword = filters.keyword;
      }

      const response = await axios.get('/api/transactions/export', {
        params,
        headers: { 
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
          'Accept': 'text/csv'
        },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `transactions-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting transactions:', error);
    }
  };

  const resetFilters = () => {
    setFilters({
      type: 'all',
      startDate: null,
      endDate: null,
      keyword: ''
    });
    setPage(0);
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography component="h2" variant="h6" color="primary" gutterBottom>
        Transaction History
      </Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              label="Type"
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              fullWidth
              margin="normal"
            >
              <MenuItem value="all">All Transactions</MenuItem>
              <MenuItem value="sent">Sent</MenuItem>
              <MenuItem value="received">Received</MenuItem>
            </TextField>
          </Grid>
          
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Grid item xs={12} sm={6} md={3}>
              <DatePicker
                label="Start Date"
                value={filters.startDate}
                onChange={(date) => handleFilterChange('startDate', date)}
                slotProps={{ textField: { fullWidth: true, margin: 'normal' } }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <DatePicker
                label="End Date"
                value={filters.endDate}
                onChange={(date) => handleFilterChange('endDate', date)}
                slotProps={{ textField: { fullWidth: true, margin: 'normal' } }}
              />
            </Grid>
          </LocalizationProvider>
          
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Search by Reason"
              value={filters.keyword}
              onChange={(e) => handleFilterChange('keyword', e.target.value)}
              fullWidth
              margin="normal"
            />
          </Grid>
          
          <Grid item xs={12} container justifyContent="flex-end" spacing={1}>
            <Grid item>
              <Button variant="outlined" onClick={resetFilters}>
                Reset Filters
              </Button>
            </Grid>
            <Grid item>
              <Button variant="contained" onClick={handleExport}>
                Export CSV
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Reason</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No transactions found
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {new Date(transaction.transactionTime).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {transaction.senderId === user?.id ? (
                          <Chip label="Sent" color="primary" size="small" />
                        ) : (
                          <Chip label="Received" color="success" size="small" />
                        )}
                      </TableCell>
                      <TableCell>
                        {transaction.senderId === user?.id
                          ? transaction.recipientName
                          : transaction.senderName}
                      </TableCell>
                      <TableCell>{transaction.amount}</TableCell>
                      <TableCell>{transaction.reason}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={totalCount}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </TableContainer>
    </Box>
  );
};

export default TransactionHistory;
