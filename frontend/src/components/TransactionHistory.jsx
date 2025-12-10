import { useParams, useNavigate, useLocation } from 'react-router-dom';
import HistoryIcon from '@mui/icons-material/History';
import LinkIcon from '@mui/icons-material/Link';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { getTransactionHistoryByWallet } from '../api';

// Map transaction status to chip colors for quick scanning
const statusColor = (status = '') => {
  const normalized = status.toLowerCase();
  if (normalized === 'confirmed') return 'success';
  if (normalized === 'pending') return 'warning';
  if (normalized === 'failed') return 'error';
  return 'default';
};

const TransactionHistory = () => {
  const navigate = useNavigate();
  const [walletAddress, setWalletAddress] = useState(localStorage.getItem('walletAddress') || '');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadTransactions = async (address) => {
    const targetAddress = address?.trim();
    if (!targetAddress) {
      setTransactions([]);
      setError('Connect a wallet first to view your transaction history.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await getTransactionHistoryByWallet(targetAddress);
      setTransactions(res.data || []);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch transaction history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (walletAddress) {
      loadTransactions(walletAddress);
    }
  }, [walletAddress]);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5', p: 3 }}>
      <Box sx={{ maxWidth: '1200px', mx: 'auto' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HistoryIcon sx={{ color: '#091057' }} />
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#091057' }}>
              Transaction History
            </Typography>
          </Box>
          <Button
            onClick={() => navigate('/tasks')}
            startIcon={<ArrowBackIcon />}
            variant="outlined"
            sx={{ textTransform: 'none' }}
          >
            Return to Notes
          </Button>
        </Box>

        <Card>
          <CardContent>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }} mb={2}>
              <TextField
                fullWidth
                label="Wallet Address"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                size="small"
              />
              <Button
                variant="contained"
                startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <RefreshIcon />}
                onClick={() => loadTransactions(walletAddress)}
                disabled={loading}
                sx={{ backgroundColor: '#091057', '&:hover': { backgroundColor: '#0d1b73' }, textTransform: 'none', color:'white' }}
              >
                Refresh
              </Button>
            </Stack>

            {error && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {walletAddress
                  ? `Showing transactions for ${walletAddress.substring(0, 24)}${walletAddress.length > 24 ? '...' : ''}`
                  : 'Connect your wallet or paste an address to view history.'}
              </Typography>
              {lastUpdated && (
                <Typography variant="caption" color="text.secondary">
                  Last updated {lastUpdated.toLocaleString()}
                </Typography>
              )}
            </Box>

            <TableContainer component={Paper}>
              <Table>
                <TableHead sx={{ backgroundColor: '#091057' }}>
                  <TableRow>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Action</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Note ID</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Transaction Hash</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Timestamp</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <CircularProgress size={24} />
                      </TableCell>
                    </TableRow>
                  ) : transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography variant="body2" color="text.secondary">
                          No transactions found for this wallet.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.map((tx) => (
                      <TableRow key={tx.id || tx.txHash}>
                        <TableCell sx={{ fontWeight: 'bold' }}>{tx.actionType}</TableCell>
                        <TableCell>{tx.noteId ?? '—'}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace' }}>
                          {tx.txHash?.substring(0, 20)}...
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={tx.status}
                            color={statusColor(tx.status)}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          {tx.timestamp ? new Date(tx.timestamp).toLocaleString() : '—'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default TransactionHistory;

