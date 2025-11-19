import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container,
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  Grid,
  Chip,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  AccountBalanceWallet as WalletIcon,
  VerifiedUser as VerifiedIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';

const BLOCKCHAIN_API = 'http://localhost:8080/api/blockchain';

function BlockchainDashboard() {
  const [walletAddress, setWalletAddress] = useState('');
  const [walletBalance, setWalletBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [txHash, setTxHash] = useState('');
  const [txDetails, setTxDetails] = useState(null);

  // Check service health
  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    try {
      const response = await axios.get(`${BLOCKCHAIN_API}/health`);
      console.log('Blockchain service healthy:', response.data);
    } catch (err) {
      setError('Blockchain service unavailable');
    }
  };

  // Search wallet
  const handleSearchWallet = async (e) => {
    e.preventDefault();
    if (!walletAddress.trim()) {
      setError('Please enter a wallet address');
      return;
    }

    await fetchWalletData(walletAddress);
  };

  // Fetch wallet data
  const fetchWalletData = async (address) => {
    try {
      setLoading(true);
      setError('');

      const [balanceRes, txRes] = await Promise.all([
        axios.get(`${BLOCKCHAIN_API}/balance/${address}`),
        axios.get(`${BLOCKCHAIN_API}/transaction-history/${address}`),
      ]);

      if (balanceRes.data.success) {
        setWalletBalance(balanceRes.data);
      } else {
        setError(balanceRes.data.error || 'Failed to fetch balance');
      }

      if (txRes.data.success) {
        setTransactions(txRes.data.transactions || []);
      }

      setSuccess('Wallet data loaded successfully');
    } catch (err) {
      setError('Error fetching wallet data: ' + err.message);
      setWalletBalance(null);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  // Verify transaction
  const handleVerifyTransaction = async (e) => {
    e.preventDefault();
    if (!txHash.trim()) {
      setError('Please enter a transaction hash');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await axios.get(`${BLOCKCHAIN_API}/verify-transaction/${txHash}`);

      if (response.data.valid) {
        setTxDetails(response.data);
        setSuccess('Transaction verified successfully');
      } else {
        setError(response.data.error || 'Invalid transaction');
        setTxDetails(null);
      }
    } catch (err) {
      setError('Error verifying transaction: ' + err.message);
      setTxDetails(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h3"
          sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <DashboardIcon fontSize="large" />
          Cardano Blockchain Dashboard
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Monitor wallet balance, verify transactions, and track blockchain interactions
        </Typography>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          onClose={() => setError('')}
          icon={<ErrorIcon />}
        >
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Wallet Search Section */}
      <Card sx={{ mb: 3, backgroundColor: '#f5f7fa' }}>
        <CardHeader
          title="Search Wallet"
          avatar={<WalletIcon />}
          subheader="Enter a Cardano address to view balance and transaction history"
        />
        <CardContent>
          <form onSubmit={handleSearchWallet}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Cardano Wallet Address"
                placeholder="addr1... or addr_test1..."
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                disabled={loading}
              />
              <Button
                variant="contained"
                type="submit"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
              >
                {loading ? 'Searching...' : 'Search'}
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>

      {/* Balance Card */}
      {walletBalance && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  ADA Balance
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                  {walletBalance.ada} ₳
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Lovelace
                </Typography>
                <Typography variant="h6" sx={{ fontFamily: 'monospace' }}>
                  {walletBalance.lovelace?.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Network
                </Typography>
                <Chip
                  label={walletBalance.network}
                  color={walletBalance.network === 'preprod' ? 'warning' : 'default'}
                  size="small"
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Transaction History */}
      {transactions.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardHeader
            title="Transaction History"
            avatar={<VerifiedIcon />}
            action={
              <Button
                size="small"
                onClick={() => fetchWalletData(walletAddress)}
                startIcon={<RefreshIcon />}
              >
                Refresh
              </Button>
            }
          />
          <CardContent>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell>
                      <strong>Type</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Transaction Hash</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Amount</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Status</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Block Height</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transactions.map((tx, index) => (
                    <TableRow key={index} hover>
                      <TableCell>
                        <Chip
                          label={tx.type.replace('_', ' ').toUpperCase()}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            fontFamily: 'monospace',
                            fontSize: '0.8rem',
                            maxWidth: '250px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {tx.hash}
                        </Typography>
                      </TableCell>
                      <TableCell>{tx.amount}</TableCell>
                      <TableCell>
                        <Chip
                          label={tx.status}
                          color={tx.status === 'confirmed' ? 'success' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{tx.blockHeight}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      <Divider sx={{ my: 3 }} />

      {/* Transaction Verification */}
      <Card sx={{ backgroundColor: '#f5f7fa' }}>
        <CardHeader
          title="Verify Transaction"
          avatar={<VerifiedIcon />}
          subheader="Enter a transaction hash to verify its status on the blockchain"
        />
        <CardContent>
          <form onSubmit={handleVerifyTransaction}>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                fullWidth
                label="Transaction Hash"
                placeholder="Enter 64-character hex hash"
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                disabled={loading}
              />
              <Button
                variant="contained"
                type="submit"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <VerifiedIcon />}
              >
                {loading ? 'Verifying...' : 'Verify'}
              </Button>
            </Box>
          </form>

          {/* Transaction Details */}
          {txDetails && (
            <Paper sx={{ p: 2, backgroundColor: '#e8f5e9', border: '2px solid #4caf50' }}>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <VerifiedIcon color="success" />
                Transaction Details
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">
                    Hash
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}
                  >
                    {txDetails.transactionHash}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">
                    Status
                  </Typography>
                  <Chip label={txDetails.status} color="success" size="small" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">
                    Confirmations
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {txDetails.confirmations}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">
                    Block Height
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {txDetails.blockHeight}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">
                    Timestamp
                  </Typography>
                  <Typography variant="body2">
                    {new Date(txDetails.timestamp).toLocaleString()}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          )}
        </CardContent>
      </Card>

      {/* Info Box */}
      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>Testnet Information:</strong> This dashboard uses the Cardano Preprod testnet. Get
          free tADA from the{' '}
          <a href="https://docs.cardano.org/cardano-testnet/tools/faucet" target="_blank" rel="noopener noreferrer">
            testnet faucet
          </a>
          . To use wallet features, install the Lace wallet extension.
        </Typography>
      </Alert>
    </Container>
  );
}

export default BlockchainDashboard;
