import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { ThemeProvider } from '@emotion/react';
import { createTheme } from '@mui/material/styles';
import {
  TextField,
  Button,
  Container,
  Box,
  Paper,
  Typography,
  Alert,
  CircularProgress,
  FormControlLabel,
  Checkbox,
  Divider,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import {
  Checklist as ChecklistIcon,
  BlockchainIcon,
  Save as SaveIcon,
  Verified as VerifiedIcon,
  Link as LinkIcon,
} from '@mui/icons-material';
import { BlazeWallet, Transaction } from '@blaze-cardano/sdk';
import { UtxoRpcProvider } from '@utxorpc/blaze-provider';

const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#f50057' },
  },
});

const BLOCKCHAIN_API = 'http://localhost:8080/api/blockchain';
const PREPROD_RPC_URL = 'https://cardano-preprod-rpc.demeter.run/';

function TaskCreateWithBlockchain() {
  const location = useLocation();
  const { userId } = location.state || {};
  const navigate = useNavigate();

  const [newNote, setNewNote] = useState({
    title: '',
    noteText: '',
    user: { userId: userId },
  });

  const [submittedNote, setSubmittedNote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [blockchainEnabled, setBlockchainEnabled] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [blockchainTx, setBlockchainTx] = useState(null);
  const [estimatedFees, setEstimatedFees] = useState(null);

  // Request wallet connection using Cardano Can I Use standard API
  const connectBlockchain = async () => {
    try {
      setLoading(true);
      setError('');

      // Verify wallet availability
      if (!window.cardano?.lace) {
        throw new Error('Lace wallet not detected. Please install it from https://www.lace.io');
      }

      // Get wallet metadata using Cardano Can I Use standard
      const walletName = window.cardano.lace.name || 'Lace';
      const apiVersion = window.cardano.lace.apiVersion;
      console.log(`Connecting to ${walletName} (API v${apiVersion})`);

      // Use enable() per Cardano Can I Use standard
      // cardano.{walletName}.enable(): Promise<API>
      const api = await window.cardano.lace.enable();
      
      if (!api) {
        throw new Error('Failed to enable wallet API');
      }

      // Use getNetworkId() per Cardano Can I Use standard
      // api.getNetworkId(): Promise<number>
      const networkId = await api.getNetworkId();
      
      if (networkId !== 0) {
        throw new Error('Please switch to Preprod testnet in your wallet');
      }

      // Use getUnusedAddresses() per Cardano Can I Use standard
      // api.getUnusedAddresses(): Promise<cbor<address>[]>
      const unusedAddresses = await api.getUnusedAddresses();
      if (!unusedAddresses || unusedAddresses.length === 0) {
        throw new Error('No addresses found in wallet');
      }

      const address = unusedAddresses[0];
      setWalletAddress(address);
      setBlockchainEnabled(true);

      // Initialize Blaze for RPC operations
      const wallet = new BlazeWallet({ networkId: 0 });
      const provider = new UtxoRpcProvider({ rpcUrl: PREPROD_RPC_URL });

      // Estimate fees
      const feesResponse = await axios.post(`${BLOCKCHAIN_API}/estimate-fees`, {
        walletAddress: address,
      });
      setEstimatedFees(feesResponse.data);

      setSuccess(`✓ Connected to ${walletName} on Preprod testnet`);
    } catch (err) {
      setError(err.message || 'Failed to connect wallet');
      setBlockchainEnabled(false);
    } finally {
      setLoading(false);
    }
  };

  // Submit task with optional blockchain verification
  const postTask = async (note) => {
    try {
      setLoading(true);

      // Post to backend
      const response = await axios.post('http://localhost:8080/api/note/post', note);
      let savedNote = response.data;

      // If blockchain enabled, create blockchain transaction
      if (blockchainEnabled && walletAddress) {
        const txResponse = await axios.post(`${BLOCKCHAIN_API}/create-transaction`, {
          walletAddress: walletAddress,
          noteId: savedNote.noteId,
          noteTitle: savedNote.title,
        });

        if (txResponse.data.success) {
          savedNote = {
            ...savedNote,
            transactionHash: txResponse.data.transactionHash,
            ipfsHash: txResponse.data.ipfsHash,
            isBlockchainVerified: true,
            blockHeight: txResponse.data.blockHeight,
          };

          // Update note with blockchain data (optional backend call)
          await axios.put(
            `http://localhost:8080/api/note/put/${savedNote.noteId}`,
            savedNote
          );

          setBlockchainTx(txResponse.data);
          setSuccess('Task created and verified on blockchain!');
        }
      } else {
        setSuccess('Task created successfully!');
      }

      setSubmittedNote(savedNote);

      // Reset form
      setNewNote({
        title: '',
        noteText: '',
        user: { userId: userId },
      });
    } catch (error) {
      setError('Error creating task: ' + error.message);
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!newNote.title || !newNote.noteText) {
      setError('Please fill in all fields');
      return;
    }

    const note = {
      ...newNote,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    postTask(note);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewNote((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <ThemeProvider theme={theme}>
      {/* Navbar */}
      <nav className="navbar">
        <h1 className="navbar-logo">TaskBuster</h1>
        <div className="navbar-links">
          <Link to="/" className="nav-link">
            Home
          </Link>
          <Link to="/register" className="nav-link">
            Register
          </Link>
          <Link to="/login" className="nav-link">
            Login
          </Link>
        </div>
      </nav>

      <div className="screen">
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
          <Typography
            variant="h3"
            gutterBottom
            sx={{ fontWeight: 'bold', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <ChecklistIcon /> Create a Task
          </Typography>

          {/* Blockchain Integration Card */}
          <Card sx={{ mb: 3, backgroundColor: '#f0f7ff', border: '2px solid #1976d2' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BlockchainIcon color="primary" />
                    Blockchain Verification
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    Optionally store your task on Cardano testnet
                  </Typography>
                </Box>
                {blockchainEnabled ? (
                  <Box sx={{ textAlign: 'right' }}>
                    <Chip label="Connected" color="success" />
                    {estimatedFees && (
                      <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                        Fee: {estimatedFees.estimatedADA} ADA
                      </Typography>
                    )}
                  </Box>
                ) : (
                  <Button
                    variant="contained"
                    onClick={connectBlockchain}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <BlockchainIcon />}
                  >
                    {loading ? 'Connecting...' : 'Enable Blockchain'}
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Alerts */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
              {success}
            </Alert>
          )}

          {/* Form */}
          <Paper elevation={3} sx={{ padding: 3, mb: 3 }}>
            <form onSubmit={handleSubmit}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Task Title"
                  name="title"
                  variant="outlined"
                  value={newNote.title}
                  onChange={handleChange}
                  fullWidth
                  required
                  placeholder="Enter task title"
                />

                <TextField
                  label="Task Description"
                  name="noteText"
                  variant="outlined"
                  value={newNote.noteText}
                  onChange={handleChange}
                  fullWidth
                  required
                  multiline
                  rows={4}
                  placeholder="Enter detailed task description"
                />

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={blockchainEnabled}
                      disabled={!blockchainEnabled}
                    />
                  }
                  label="Verify this task on Cardano blockchain"
                />

                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                  sx={{ mt: 2, py: 1.5, fontSize: '1rem' }}
                >
                  {loading ? 'Creating Task...' : 'Create Task'}
                </Button>
              </Box>
            </form>
          </Paper>

          {/* Submitted Task Summary */}
          {submittedNote && (
            <Card sx={{ backgroundColor: '#e8f5e9', mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <VerifiedIcon color="success" />
                  Task Created Successfully
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Grid container spacing={2}>
                  <Grid xs={12} sm={6}>
                    <Typography variant="body2" color="textSecondary">
                      Task ID
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      #{submittedNote.noteId}
                    </Typography>
                  </Grid>

                  <Grid xs={12} sm={6}>
                    <Typography variant="body2" color="textSecondary">
                      Title
                    </Typography>
                    <Typography variant="body1">{submittedNote.title}</Typography>
                  </Grid>

                  <Grid xs={12}>
                    <Typography variant="body2" color="textSecondary">
                      Description
                    </Typography>
                    <Typography variant="body1">{submittedNote.noteText}</Typography>
                  </Grid>

                  {/* Blockchain Info */}
                  {submittedNote.isBlockchainVerified && blockchainTx && (
                    <>
                      <Grid xs={12}>
                        <Divider />
                      </Grid>

                      <Grid xs={12}>
                        <Typography
                          variant="h6"
                          sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}
                        >
                          <LinkIcon /> Blockchain Verification
                        </Typography>
                      </Grid>

                      <Grid xs={12}>
                        <Typography variant="caption" color="textSecondary">
                          Transaction Hash
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            wordBreak: 'break-all',
                            fontFamily: 'monospace',
                            backgroundColor: '#f5f5f5',
                            p: 1,
                            borderRadius: 1,
                          }}
                        >
                          {blockchainTx.transactionHash}
                        </Typography>
                      </Grid>

                      <Grid xs={12} sm={6}>
                        <Typography variant="caption" color="textSecondary">
                          IPFS Hash
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            wordBreak: 'break-all',
                            fontFamily: 'monospace',
                            backgroundColor: '#f5f5f5',
                            p: 1,
                            borderRadius: 1,
                          }}
                        >
                          {blockchainTx.ipfsHash}
                        </Typography>
                      </Grid>

                      <Grid xs={12} sm={6}>
                        <Typography variant="caption" color="textSecondary">
                          Block Height
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                          {blockchainTx.blockHeight}
                        </Typography>
                      </Grid>

                      <Grid xs={12}>
                        <Button
                          variant="outlined"
                          href={blockchainTx.explorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          size="small"
                        >
                          View on Block Explorer
                        </Button>
                      </Grid>
                    </>
                  )}
                </Grid>
              </CardContent>
            </Card>
          )}
        </Container>
      </div>
    </ThemeProvider>
  );
}

export default TaskCreateWithBlockchain;
