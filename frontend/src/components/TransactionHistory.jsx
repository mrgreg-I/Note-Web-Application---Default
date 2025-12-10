import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import HistoryIcon from '@mui/icons-material/History';
import RefreshIcon from '@mui/icons-material/Refresh';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
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
import { useNavigate } from 'react-router-dom';
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
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);

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

  const handleRowClick = (transaction) => {
    setSelectedTransaction(transaction);
    setModalOpen(true);
    setCopySuccess(false);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedTransaction(null);
    setCopySuccess(false);
  };

  const handleCopyHash = async (e) => {
    e.stopPropagation(); // Prevent modal from closing if clicked inside
    if (selectedTransaction?.txHash) {
      try {
        await navigator.clipboard.writeText(selectedTransaction.txHash);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = selectedTransaction.txHash;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
          setCopySuccess(true);
          setTimeout(() => setCopySuccess(false), 2000);
        } catch (fallbackErr) {
          console.error('Fallback copy failed:', fallbackErr);
        }
        document.body.removeChild(textArea);
      }
    }
  };

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
                      <TableRow 
                        key={tx.id || tx.txHash}
                        onClick={() => handleRowClick(tx)}
                        sx={{ 
                          cursor: 'pointer',
                          '&:hover': {
                            backgroundColor: 'rgba(9, 16, 87, 0.08)',
                          },
                          transition: 'background-color 0.2s ease',
                        }}
                      >
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

        {/* Transaction Details Modal */}
        <Dialog 
          open={modalOpen} 
          onClose={handleCloseModal} 
          maxWidth="md" 
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 2,
            }
          }}
        >
          <DialogTitle 
            sx={{ 
              backgroundColor: '#091057', 
              color: 'white', 
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <HistoryIcon />
            Transaction Details
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            {selectedTransaction && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <Box>
                  <Typography sx={{ fontWeight: 'bold', color: '#091057', mb: 0.5 }}>
                    Action:
                  </Typography>
                  <Typography sx={{ fontFamily: 'inherit' }}>
                    {selectedTransaction.actionType || '—'}
                  </Typography>
                </Box>

                <Box>
                  <Typography sx={{ fontWeight: 'bold', color: '#091057', mb: 0.5 }}>
                    Note ID:
                  </Typography>
                  <Typography sx={{ fontFamily: 'inherit' }}>
                    {selectedTransaction.noteId ?? '—'}
                  </Typography>
                </Box>

                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography sx={{ fontWeight: 'bold', color: '#091057' }}>
                      Transaction Hash:
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {copySuccess && (
                        <Typography variant="caption" sx={{ color: 'success.main', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <CheckCircleIcon sx={{ fontSize: 16 }} />
                          Copied!
                        </Typography>
                      )}
                      <IconButton
                        onClick={handleCopyHash}
                        size="small"
                        sx={{
                          color: '#091057',
                          '&:hover': {
                            backgroundColor: 'rgba(9, 16, 87, 0.08)',
                          },
                        }}
                        title="Copy transaction hash"
                      >
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      p: 2,
                      backgroundColor: '#f5f5f5',
                      borderRadius: 1,
                      border: '1px solid #e0e0e0',
                      wordBreak: 'break-all',
                      fontFamily: 'monospace',
                      fontSize: '0.875rem',
                      position: 'relative',
                    }}
                  >
                    <Typography sx={{ fontFamily: 'monospace', userSelect: 'text' }}>
                      {selectedTransaction.txHash || '—'}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    Click the copy icon to copy the full transaction hash. You can verify this transaction on Cardano Scan.
                  </Typography>
                </Box>

                <Box>
                  <Typography sx={{ fontWeight: 'bold', color: '#091057', mb: 0.5 }}>
                    Status:
                  </Typography>
                  <Chip
                    label={selectedTransaction.status}
                    color={statusColor(selectedTransaction.status)}
                    size="small"
                    variant="outlined"
                  />
                </Box>

                <Box>
                  <Typography sx={{ fontWeight: 'bold', color: '#091057', mb: 0.5 }}>
                    Timestamp:
                  </Typography>
                  <Typography sx={{ fontFamily: 'inherit' }}>
                    {selectedTransaction.timestamp 
                      ? new Date(selectedTransaction.timestamp).toLocaleString() 
                      : '—'}
                  </Typography>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button 
              onClick={handleCloseModal} 
              sx={{ 
                textTransform: 'none',
                color: '#091057',
              }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default TransactionHistory;

