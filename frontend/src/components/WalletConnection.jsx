import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  Grid,
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import axios from 'axios';

const WalletConnection = ({ onWalletConnect }) => {
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [walletName, setWalletName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [networkInfo, setNetworkInfo] = useState(null);
  const [canIUseFeatures, setCanIUseFeatures] = useState(null);

  // Available wallets from Cardano Can I Use (https://www.cardano-caniuse.io/)
  const SUPPORTED_WALLETS = ['lace', 'eternl', 'flint', 'nami'];

  useEffect(() => {
    // Check if wallet is already connected
    checkWalletConnection();
    // Fetch network configuration and Can I Use features
    fetchNetworkConfig();
    fetchCanIUseFeatures();
  }, []);

  const checkWalletConnection = async () => {
    try {
      const storedWallet = localStorage.getItem('connectedWallet');
      const storedAddress = localStorage.getItem('walletAddress');
      
      if (storedWallet && storedAddress) {
        setWalletName(storedWallet);
        setWalletAddress(storedAddress);
        setWalletConnected(true);
        setSuccess(`Wallet reconnected: ${storedWallet}`);
      }
    } catch (err) {
      console.error('Error checking wallet connection:', err);
    }
  };

  const fetchNetworkConfig = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/blockchain/network-config');
      setNetworkInfo(response.data);
    } catch (err) {
      console.error('Error fetching network config:', err);
    }
  };

  const fetchCanIUseFeatures = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/blockchain/caniuse-features');
      setCanIUseFeatures(response.data);
    } catch (err) {
      console.error('Error fetching Can I Use features:', err);
    }
  };

  /**
   * Connect to Cardano wallet using Cardano Can I Use standard API (CIP-0030)
   * Reference: https://www.cardano-caniuse.io/
   */
  const connectWallet = async (walletNameParam) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Check if wallet extension is available
      if (!window.cardano) {
        throw new Error('No Cardano wallet extension found. Please install Lace, Eternl, Flint, or Nami wallet.');
      }

      // Get the wallet from window.cardano
      const wallet = window.cardano[walletNameParam];
      if (!wallet) {
        throw new Error(`${walletNameParam} wallet not found. Please install it first.`);
      }

      // Use Cardano Can I Use standard API (CIP-0030)
      // Step 1: Check if wallet is available (isEnabled)
      const isEnabled = await wallet.isEnabled?.();
      
      // Step 2: Request access to wallet (enable)
      const api = await wallet.enable?.();
      if (!api) {
        throw new Error('Failed to connect to wallet. Permission denied.');
      }

      // Step 3: Get unused addresses for the wallet
      const addresses = await api.getUnusedAddresses?.();
      if (!addresses || addresses.length === 0) {
        throw new Error('No addresses found in wallet.');
      }

      const selectedAddress = addresses[0];

      // Step 4: Get network ID to verify connection
      const networkId = await api.getNetworkId?.();
      const network = networkId === 0 ? 'testnet' : 'mainnet';

      // Validate wallet address with backend
      const validationResponse = await axios.post(
        'http://localhost:8080/api/blockchain/validate-wallet',
        null,
        {
          params: {
            walletAddress: selectedAddress,
            walletName: walletNameParam,
          },
        }
      );

      if (validationResponse.data.isValid) {
        setWalletConnected(true);
        setWalletAddress(selectedAddress);
        setWalletName(walletNameParam);
        setSuccess(`Successfully connected to ${walletNameParam} wallet!\nAddress: ${selectedAddress.substring(0, 20)}...`);

        // Store wallet info
        localStorage.setItem('connectedWallet', walletNameParam);
        localStorage.setItem('walletAddress', selectedAddress);
        localStorage.setItem('walletNetwork', network);

        // Notify parent component
        if (onWalletConnect) {
          onWalletConnect({
            walletName: walletNameParam,
            address: selectedAddress,
            network: network,
            api: api,
          });
        }
      } else {
        throw new Error('Invalid wallet address format');
      }
    } catch (err) {
      console.error('Wallet connection error:', err);
      setError(err.message || 'Failed to connect wallet');
      setWalletConnected(false);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Disconnect wallet
   */
  const disconnectWallet = () => {
    setWalletConnected(false);
    setWalletAddress('');
    setWalletName('');
    localStorage.removeItem('connectedWallet');
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('walletNetwork');
    setSuccess('Wallet disconnected');
  };

  /**
   * Sync wallet using Cardano Can I Use standards
   */
  const syncWallet = async () => {
    if (!walletConnected) {
      setError('Please connect a wallet first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Resync wallet connection
      await connectWallet(walletName);
      setSuccess('Wallet synced successfully!');
    } catch (err) {
      setError('Failed to sync wallet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Card sx={{ mb: 3, backgroundColor: '#f5f5f5' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <AccountBalanceWalletIcon sx={{ mr: 2, fontSize: 32, color: '#091057' }} />
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#091057' }}>
              Lace Wallet Connection
            </Typography>
          </Box>

          <Divider sx={{ mb: 2 }} />

          {/* Connection Status */}
          <Box sx={{ mb: 3 }}>
            {walletConnected ? (
              <Alert severity="success" icon={<CheckCircleIcon />}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  ✅ {walletName.charAt(0).toUpperCase() + walletName.slice(1)} Wallet Connected
                </Typography>
                <Typography variant="caption">
                  Address: {walletAddress.substring(0, 30)}...
                </Typography>
              </Alert>
            ) : (
              <Alert severity="info">
                No wallet connected. Click a button below to connect.
              </Alert>
            )}
          </Box>

          {/* Error and Success Messages */}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          {/* Network Info */}
          {networkInfo && (
            <Box sx={{ mb: 3, p: 2, backgroundColor: '#fff', borderRadius: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                Network Information:
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption">
                    <strong>Network:</strong> {networkInfo.network}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption">
                    <strong>Chain ID:</strong> {networkInfo.chainId}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Can I Use Features Info */}
          {canIUseFeatures && (
            <Box sx={{ mb: 3, p: 2, backgroundColor: '#e8f5e9', borderRadius: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                Cardano Can I Use Info:
              </Typography>
              <Typography variant="caption" display="block" sx={{ mb: 1 }}>
                <strong>Standard API:</strong> {canIUseFeatures.standardApi} (CIP-0030)
              </Typography>
              <Typography variant="caption" display="block">
                <strong>Source:</strong>{' '}
                <a href={canIUseFeatures.source} target="_blank" rel="noopener noreferrer" style={{ color: '#1976d2' }}>
                  {canIUseFeatures.source}
                </a>
              </Typography>
            </Box>
          )}

          {/* Wallet Connection Buttons */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2 }}>
              Available Wallets (from cardano-caniuse.io):
            </Typography>
            <Grid container spacing={2}>
              {SUPPORTED_WALLETS.map((wallet) => (
                <Grid item xs={12} sm={6} key={wallet}>
                  <Button
                    fullWidth
                    variant={walletConnected && walletName === wallet ? 'contained' : 'outlined'}
                    color={walletConnected && walletName === wallet ? 'success' : 'primary'}
                    onClick={() => connectWallet(wallet)}
                    disabled={loading}
                    sx={{
                      textTransform: 'capitalize',
                      fontWeight: 'bold',
                      py: 1.5,
                    }}
                  >
                    {loading && walletName === wallet ? (
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                    ) : null}
                    Connect {wallet.charAt(0).toUpperCase() + wallet.slice(1)}
                  </Button>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Sync Button */}
          <Box sx={{ mb: 2 }}>
            <Button
              fullWidth
              variant="outlined"
              color="primary"
              onClick={syncWallet}
              disabled={!walletConnected || loading}
              sx={{
                fontWeight: 'bold',
                py: 1.5,
                mb: 1,
              }}
            >
              🔄 Sync Wallet (Cardano Can I Use)
            </Button>
          </Box>

          {/* Disconnect Button */}
          {walletConnected && (
            <Box>
              <Button
                fullWidth
                variant="contained"
                color="error"
                onClick={disconnectWallet}
                disabled={loading}
                sx={{
                  fontWeight: 'bold',
                  py: 1.5,
                }}
              >
                Disconnect Wallet
              </Button>
            </Box>
          )}

          {/* Info Chips */}
          <Box sx={{ mt: 3, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            <Chip
              icon={<AccountBalanceWalletIcon />}
              label="Lace Support ✅"
              color="primary"
              variant="outlined"
              size="small"
            />
            <Chip
              label="CIP-0030 Standard ✅"
              color="success"
              variant="outlined"
              size="small"
            />
            <Chip
              label="Cardano Preprod Network"
              color="info"
              variant="outlined"
              size="small"
            />
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default WalletConnection;
