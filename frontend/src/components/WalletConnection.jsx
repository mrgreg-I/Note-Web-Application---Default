import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container,
  Box,
  Paper,
  Button,
  TextField,
  Card,
  CardContent,
  Typography,
  Alert,
  CircularProgress,
  Divider,
  Grid,
  Chip,
} from '@mui/material';
import { 
  Wallet as WalletIcon,
  AccountBalanceWallet as BalanceIcon,
  VerifiedUser as VerifiedIcon,
  ContentCopy as CopyIcon
} from '@mui/icons-material';
import { BlazeWallet } from '@blaze-cardano/sdk';
import { UtxoRpcProvider } from '@utxorpc/blaze-provider';

const BLOCKCHAIN_API = 'http://localhost:8080/api/blockchain';
const PREPROD_RPC_URL = 'https://cardano-preprod-rpc.demeter.run/';

function WalletConnection() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [walletBalance, setWalletBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [transactionHistory, setTransactionHistory] = useState([]);

  // Check for Lace wallet extension using Cardano Can I Use standard
  useEffect(() => {
    const checkLaceWallet = async () => {
      try {
        // Check if cardano object exists (Cardano Can I Use standard)
        if (typeof window !== 'undefined' && window.cardano?.lace) {
          // Use isEnabled() per Cardano Can I Use standard
          const isEnabled = await window.cardano.lace.isEnabled();
          if (isEnabled) {
            console.log('Lace wallet already enabled');
            const address = await connectWallet();
            if (address) {
              await fetchWalletBalance(address);
              await fetchTransactionHistory(address);
            }
          } else {
            console.log('Lace wallet detected but not enabled');
          }
        } else {
          setError('Lace wallet not detected. Please install it from https://www.lace.io');
        }
      } catch (err) {
        console.error('Wallet check error:', err);
      }
    };

    checkLaceWallet();
  }, []);

  // Connect wallet using Cardano Can I Use standard API
  const connectWallet = async () => {
    try {
      setLoading(true);
      setError('');

      // Verify Lace wallet is available
      if (!window.cardano?.lace) {
        throw new Error('Lace wallet not found. Please ensure it\'s installed and enabled.');
      }

      // Get wallet info using Cardano Can I Use standard
      const walletName = window.cardano.lace.name || 'Lace';
      const walletIcon = window.cardano.lace.icon;
      const apiVersion = window.cardano.lace.apiVersion;
      console.log(`Connecting to ${walletName} (API v${apiVersion})`);

      // Use enable() per Cardano Can I Use standard to request wallet access
      // cardano.{walletName}.enable(): Promise<API>
      const api = await window.cardano.lace.enable();
      
      if (!api) {
        throw new Error('Failed to enable wallet API');
      }

      // Use getNetworkId() per Cardano Can I Use standard
      // api.getNetworkId(): Promise<number>
      const networkId = await api.getNetworkId();
      if (networkId !== 0) {
        throw new Error('Please switch to testnet (preprod) in your wallet. Current: ' + 
          (networkId === 1 ? 'mainnet' : `network ${networkId}`));
      }

      // Use getUnusedAddresses() per Cardano Can I Use standard
      // api.getUnusedAddresses(): Promise<cbor<address>[]>
      const unusedAddresses = await api.getUnusedAddresses();
      if (!unusedAddresses || unusedAddresses.length === 0) {
        throw new Error('No addresses found in wallet');
      }

      const address = unusedAddresses[0];
      setWalletAddress(address);
      setWalletConnected(true);
      setSuccess(`✓ Connected to ${walletName} on Preprod testnet`);

      // Also initialize Blaze wallet for RPC operations
      const wallet = new BlazeWallet({ networkId: 0 });
      const provider = new UtxoRpcProvider({ rpcUrl: PREPROD_RPC_URL });

      // Verify connection with backend
      await verifyWalletConnection(address);

      return address;
    } catch (err) {
      setError(err.message || 'Failed to connect wallet');
      console.error('Connection error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Verify wallet connection with backend
  const verifyWalletConnection = async (address) => {
    try {
      const response = await axios.post(`${BLOCKCHAIN_API}/verify-wallet`, {
        walletAddress: address,
      });

      if (response.data.connected) {
        setSuccess('Wallet verified on blockchain!');
      }
    } catch (err) {
      console.error('Verification error:', err);
    }
  };

  // Fetch wallet balance using Cardano Can I Use standard API
  const fetchWalletBalance = async (address) => {
    try {
      setLoading(true);

      // Use api.getBalance() per Cardano Can I Use standard
      // api.getBalance(): Promise<cbor<value>>
      if (window.cardano?.lace) {
        const api = await window.cardano.lace.enable();
        const balanceHex = await api.getBalance();
        
        // Parse the balance and also get via backend for persistence
        const response = await axios.get(`${BLOCKCHAIN_API}/balance/${address}`);
        if (response.data.success) {
          setWalletBalance(response.data);
        }
      } else {
        throw new Error('Wallet not available');
      }
    } catch (err) {
      setError('Failed to fetch wallet balance: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch transaction history
  const fetchTransactionHistory = async (address) => {
    try {
      const response = await axios.get(`${BLOCKCHAIN_API}/transaction-history/${address}`);

      if (response.data.success && response.data.transactions) {
        setTransactionHistory(response.data.transactions);
      }
    } catch (err) {
      console.error('Failed to fetch transaction history:', err);
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setWalletConnected(false);
    setWalletAddress('');
    setWalletBalance(null);
    setTransactionHistory([]);
    setSuccess('Wallet disconnected');
  };

  // Copy address to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setSuccess('Address copied to clipboard!');
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <WalletIcon /> Cardano Lace Wallet Integration
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Connect your Lace wallet to interact with the Cardano testnet (preprod)
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Success Alert */}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Connection Status Card */}
      <Card sx={{ mb: 3, backgroundColor: walletConnected ? '#e8f5e9' : '#fff3e0' }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6">
                {walletConnected ? 'Wallet Connected' : 'Wallet Disconnected'}
              </Typography>
              {walletConnected && walletAddress && (
                <Typography variant="body2" color="textSecondary" sx={{ wordBreak: 'break-all', mt: 1 }}>
                  {walletAddress}
                  <Button
                    size="small"
                    startIcon={<CopyIcon />}
                    onClick={() => copyToClipboard(walletAddress)}
                    sx={{ ml: 1 }}
                  >
                    Copy
                  </Button>
                </Typography>
              )}
            </Box>
            <Box>
              {walletConnected ? (
                <Button
                  variant="contained"
                  color="error"
                  onClick={disconnectWallet}
                  disabled={loading}
                >
                  Disconnect
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={connectWallet}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <WalletIcon />}
                >
                  {loading ? 'Connecting...' : 'Connect Wallet'}
                </Button>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Wallet Balance Card */}
      {walletConnected && walletBalance && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <BalanceIcon color="primary" />
              <Typography variant="h6">Wallet Balance</Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid xs={12} sm={6}>
                <Paper sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
                  <Typography variant="body2" color="textSecondary">
                    ADA Balance
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                    {walletBalance.ada} ADA
                  </Typography>
                </Paper>
              </Grid>
              <Grid xs={12} sm={6}>
                <Paper sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
                  <Typography variant="body2" color="textSecondary">
                    Lovelace
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {walletBalance.lovelace?.toLocaleString()} ₳
                  </Typography>
                </Paper>
              </Grid>
              <Grid xs={12}>
                <Typography variant="caption" color="textSecondary">
                  Network: {walletBalance.network} | Last Updated: {new Date(walletBalance.lastUpdated).toLocaleString()}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Transaction History */}
      {walletConnected && transactionHistory.length > 0 && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <VerifiedIcon color="success" />
              <Typography variant="h6">Recent Transactions</Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ maxHeight: '300px', overflowY: 'auto' }}>
              {transactionHistory.map((tx, index) => (
                <Paper key={index} sx={{ p: 2, mb: 1, backgroundColor: '#f9f9f9' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {tx.type.replace('_', ' ').toUpperCase()}
                      </Typography>
                      <Typography variant="caption" color="textSecondary" sx={{ wordBreak: 'break-all' }}>
                        {tx.hash}
                      </Typography>
                      <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                        Block Height: {tx.blockHeight}
                      </Typography>
                    </Box>
                    <Chip
                      label={tx.status}
                      color={tx.status === 'confirmed' ? 'success' : 'warning'}
                      size="small"
                    />
                  </Box>
                </Paper>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Info Box */}
      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>Important:</strong> This app uses the Cardano Preprod testnet. You can get free tADA from the{' '}
          <a href="https://docs.cardano.org/cardano-testnet/tools/faucet" target="_blank" rel="noopener noreferrer">
            testnet faucet
          </a>
          .
        </Typography>
      </Alert>
    </Container>
  );
}

export default WalletConnection;
