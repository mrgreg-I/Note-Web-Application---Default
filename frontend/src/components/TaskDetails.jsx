import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Typography from '@mui/material/Typography';
import { TextField, Button, Container, Box, Paper, IconButton, Alert, Card, CardContent } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import {Blockfrost, WebWallet, Blaze, Core} from '@blaze-cardano/sdk'
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { Link } from 'react-router-dom';
import Logo from "../assets/Logo1.png"
import AddIcon from '@mui/icons-material/Add';

function TaskUpdate() {
  
  const navigate = useNavigate();
  const location = useLocation();
  const { noteId } = location.state || {};
  const [isEditMode, setIsEditMode] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [walletAddress, setWalletAddress] = useState('');
  const [walletName, setWalletName] = useState('');
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletApi, setWalletApi] = useState();
  const [provider] = useState(() => new Blockfrost({
      network: 'cardano-preview',
      projectId: import.meta.env.VITE_BLOCKFROST_PROJECT_ID,
    }))
  const [currentData, setCurrentData] = useState({
    noteId: '',
    title: '',
    noteText: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    user: { userId: '' },
  });
  const [updateData, setUpdateData] = useState({
    noteId: '',
    title: '',
    noteText: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    user: { userId: '' },
  });

  const [transactionInfo, setTransactionInfo] = useState(null);
  const [showTransactionDialog, setShowTransactionDialog] = useState(false);
  const [transactionError, setTransactionError] = useState('');

  console.log('noteId from location.state:', noteId);
  const token = localStorage.getItem('authToken');
  const userId = localStorage.getItem('loggedInUserId');

  const authHeaders = () => {
    if (!token) {
      navigate('/login');
      return null;
    }
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    };
  };

  useEffect(() => {
    const fetchData = async () => {
      if (noteId) {
        try {
  
          const api = await window.cardano['lace'].enable();
          setWalletApi(api);
          console.log("WalletAPI: ",api);
          setWalletAddress(localStorage.getItem('walletAddress'));
          const taskResponse = await axios.get(`/api/note/get/${noteId}`);
          setCurrentData(taskResponse.data);
          setUpdateData(taskResponse.data);
          console.log('Fetched note:', taskResponse.data);
          
        } catch (error) {
          console.error('Error fetching task:', error);
        }
      }
    };
    fetchData();
  }, [noteId]);

  const formatLovelaceToAda = (lovelaceAmount) => {
    const lovelace = BigInt(lovelaceAmount);
    const LOVELACE_PER_ADA = 1_000_000n;
    const ada = lovelace / LOVELACE_PER_ADA;
    const remainder = lovelace % LOVELACE_PER_ADA;
    let fractionalPart = remainder.toString().padStart(6, '0');
    const formattedAda = (Number(ada.toString() + "." + fractionalPart).toFixed(2));
    return `${formattedAda} ADA`;
  };

  const handleSubmitTransaction = async () => {

    const lovelaceAmount = 1_000_000n; 
    
    if(walletApi){
      try{
        const wallet = new WebWallet(walletApi)
        const blaze= await Blaze.from(provider,wallet)
        console.log("Blaze instance created!", blaze);
        const bench32Address = Core.Address.fromBytes(Buffer.from(walletAddress, 'hex')).toBech32;
        console.log("Recipient Address (bech32): ",bench32Address);
        const tx = await blaze
        .newTransaction()
        .payLovelace(
            Core.Address.fromBech32(
                "addr_test1qq3ets7dxg8aure96num4zz7asrmy9nr8kgsy6t3jfdhv9yrv4w2has733mkknfv0q9ugh3vum305c5ywd65gmg5sn0qncs98a",
            ),
            lovelaceAmount,
        )
        .complete();
        console.log("Transaction: ",tx.toCbor());
        const signexTx = await blaze.signTransaction(tx);

        const txId = await blaze.provider.postTransactionToChain(signexTx);

        console.log("Transaction ID", txId);
        
        return { 
            transactionId: txId, 
            amount: lovelaceAmount, 
        };
      }
      catch(error){
        console.error("Error submitting transaction:",error);
        return null; 
      }
    }
    return null; 
  };

  const updateTask = async (note) => {
    try {
      const response = await axios.put(`/api/note/put/${note.noteId}`, note);
      console.log("Note updated successfully:", response.data);
      const txResult = await handleSubmitTransaction();
      setTransactionInfo({
        type: 'UPDATE',
        noteTitle: note.title,
        noteText: note.noteText,
        transactionId: txResult.transactionId,
        network: provider.network,
        fee: txResult.amount,
        wallet: localStorage.getItem('connectedWallet')
      });
      setShowTransactionDialog(true);
      
      setCurrentData(prevState => ({
        ...prevState,
        title: response.data.title,
        noteText: response.data.noteText,
        updatedAt: new Date().toISOString(),
      }));

      setUpdateData(prevData => ({
        ...prevData,
        title: response.data.title,
        noteText: response.data.noteText,
        updatedAt: new Date().toISOString(),
      }));
          
      setIsEditMode(false);
    } catch (error) {
      console.error("Error updating note:", error);
    }
  };

  const handleUpdateSubmit = (e) => {
    e.preventDefault();
    updateTask(updateData);
  };

  const handleUpdateChange = (e) => {
    const { name, value } = e.target;
    setUpdateData(prevData => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('loggedInUserId');
    navigate('/login');
  };

  const logTransactionToBlockchain = async (noteId, noteTitle, actionType) => {
    try {
      const walletAddr = localStorage.getItem('walletAddress');
      const wallet = localStorage.getItem('connectedWallet');
      
      if (!walletAddr || !wallet) {
        console.log('Wallet not connected - logging locally only');
        return null;
      }

      let endpoint = '';
      let payload = {
        walletAddress: walletAddr,
        noteId: noteId,
        noteTitle: noteTitle
      };

      if (actionType === 'DELETE') {
        endpoint = '/api/blockchain/simulate-note-deletion-transaction';
      }

      const response = await axios.post(`http://localhost:8080${endpoint}`, payload);
      console.log(`${actionType} transaction logged:`, response.data);
      return response.data;
    } catch (error) {
      console.error('Error logging to blockchain:', error);
      setTransactionError(`Blockchain logging failed: ${error.message}`);
      return null;
    }
  };

  const handleCloseTransactionDialog = () => {
    setShowTransactionDialog(false);
    setTransactionInfo(null);
    setTransactionError('');
  };

  const confirmDeleteTask = () => {
    if (selectedNote && selectedNote.noteId) {
   
      axios.delete(`/api/note/delete/${selectedNote.noteId}`)
        .then(async () => {
          const txInfo = await logTransactionToBlockchain(selectedNote.noteId, selectedNote.title, 'DELETE');
          
          if (txInfo) {
            setTransactionInfo({
              type: 'DELETE',
              noteTitle: selectedNote.title,
              transactionId: txInfo.transactionId,
              network: txInfo.network,
              fee: txInfo.fee,
              wallet: localStorage.getItem('connectedWallet')
            });
            setShowTransactionDialog(true);
            setTimeout(() => {
              navigate(`/tasks`);
              setConfirm(false);
            }, 2000);
          } else {
            navigate(`/tasks`);
            setConfirm(false);
          }
        })
        .catch(error => {
          console.error('Error deleting task:', error);
          setTransactionError("Error deleting task: " + error.message);
          setConfirm(false);
        });
    }
  };

  const handleSyncWallet = async () => {
    try {
      setWalletError('');
      setWalletSuccess('');

      if (!window.cardano) {
        setWalletError('Cardano object not found. Please ensure a Cardano wallet extension is installed.');
        return;
      }

      const walletOptions = ['lace', 'eternl', 'flint', 'nami'];
      let connected = false;
      let connectedWalletName = '';

      for (const wallet of walletOptions) {
        if (window.cardano[wallet]) {
          try {
            const api = await window.cardano[wallet].enable();
            setWalletApi(api);
            console.log("WalletAPI: ",api);
            if (api) {
              const walletAddress = await api.getChangeAddress();
              console.log("Wallet Address: ",walletAddress);
              setWalletAddress(walletAddress);
            }
          } catch (error) {
            console.log(`Could not connect to ${wallet}:`, error.message);
            continue;
          }
        }
      }

      if (!connected) {
        setWalletError('No Cardano wallet found or permission denied. Please install Lace, Eternl, Flint, or Nami wallet extension.');
      }
    } catch (error) {
      console.error('Error syncing wallet:', error);
      setWalletError(`Error: ${error.message || 'Failed to sync wallet'}`);
    }   
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      {/* Sidebar */}
      <Box sx={{ 
        width: '250px', 
        bgcolor: 'white', 
        borderRight: '1px solid #e0e0e0',
        display: 'flex',
        flexDirection: 'column',
        p: 3
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <img src={Logo} alt="Logo" style={{ height: '30px', marginRight: '12px' }} />
          <Typography sx={{ fontWeight: 'bold', fontSize: '20px', fontFamily: 'Poppins' }}>
            Default
          </Typography>
        </Box>

        <Button
          fullWidth
          variant="contained"
          startIcon={<ArrowBackIcon />}
          sx={{
            backgroundColor: '#091057',
            color: 'white',
            fontFamily: 'Poppins',
            textTransform: 'none',
            mb: 3,
            py: 1.5,
            '&:hover': {
              backgroundColor: '#0a1a6b'
            }
          }}
          onClick={() => navigate('/tasks')}
        >
          Back to Notes
        </Button>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1, cursor: 'pointer', '&:hover': { bgcolor: '#f5f5f5' }, borderRadius: 1 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#4CAF50' }} />
            <Typography sx={{ fontFamily: 'Poppins', fontSize: '14px' }}>All</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1, cursor: 'pointer', '&:hover': { bgcolor: '#f5f5f5' }, borderRadius: 1 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#2196F3' }} />
            <Typography sx={{ fontFamily: 'Poppins', fontSize: '14px' }}>Personal</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1, cursor: 'pointer', '&:hover': { bgcolor: '#f5f5f5' }, borderRadius: 1 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#FF5722' }} />
            <Typography sx={{ fontFamily: 'Poppins', fontSize: '14px' }}>Work</Typography>
          </Box>
        </Box>

        <Box sx={{ mt: 'auto', pt: 3 }}>
          <Box sx={{ 
            bgcolor: '#f5f5f5', 
            borderRadius: 2, 
            p: 2,
            textAlign: 'center'
          }}>
            <Box sx={{ 
              width: 60, 
              height: 60, 
              borderRadius: '50%', 
              bgcolor: '#FFF9C4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2
            }}>
              <Typography sx={{ fontSize: '30px' }}>👤</Typography>
            </Box>
            <Typography sx={{ fontFamily: 'Poppins', fontSize: '12px', mb: 1 }}>
              {walletConnected ? walletName : 'No Wallet'}
            </Typography>
            <Button
              fullWidth
              variant="contained"
              size="small"
              sx={{
                backgroundColor: '#091057',
                color: 'white',
                fontFamily: 'Poppins',
                textTransform: 'none',
                fontSize: '11px',
                py: 0.5
              }}
              onClick={handleSyncWallet}
            >
              {walletConnected ? 'Connected' : 'Sync Wallet'}
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ 
          bgcolor: 'white', 
          borderBottom: '1px solid #e0e0e0',
          px: 4,
          py: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Typography sx={{ fontWeight: 'bold', fontSize: '24px', fontFamily: 'Poppins' }}>
            NOTE DETAILS
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {!isEditMode ? (
              <>
                <Button
                  variant="contained"
                  startIcon={<EditIcon />}
                  sx={{
                    backgroundColor: '#091057',
                    color: 'white',
                    fontFamily: 'Poppins',
                    textTransform: 'none',
                    '&:hover': {
                      backgroundColor: '#0a1a6b'
                    }
                  }}
                  onClick={() => setIsEditMode(true)}
                >
                  Edit
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  sx={{
                    fontFamily: 'Poppins',
                    textTransform: 'none',
                  }}
                  onClick={() => {
                    setSelectedNote(currentData);
                    setConfirm(true);
                  }}
                >
                  Delete
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  sx={{
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    fontFamily: 'Poppins',
                    textTransform: 'none',
                    '&:hover': {
                      backgroundColor: '#45a049'
                    }
                  }}
                  onClick={handleUpdateSubmit}
                >
                  Save
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  sx={{
                    fontFamily: 'Poppins',
                    textTransform: 'none',
                  }}
                  onClick={() => {
                    setUpdateData(currentData);
                    setIsEditMode(false);
                  }}
                >
                  Cancel
                </Button>
              </>
            )}
          </Box>
        </Box>

        {/* Content Area */}
        <Box sx={{ flex: 1, p: 4, overflow: 'auto' }}>
          <Card sx={{ 
            maxWidth: 800,
            mx: 'auto',
            borderRadius: 3,
            boxShadow: 2
          }}>
            <CardContent sx={{ p: 4 }}>
              {/* Title Section */}
              <Box sx={{ mb: 4 }}>
                <Typography sx={{ 
                  fontFamily: 'Poppins', 
                  fontSize: '12px', 
                  color: '#999',
                  mb: 1
                }}>
                  TITLE
                </Typography>
                {isEditMode ? (
                  <TextField
                    fullWidth
                    name="title"
                    value={updateData.title}
                    onChange={handleUpdateChange}
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        fontFamily: 'Poppins',
                        fontSize: '24px',
                        fontWeight: 'bold',
                      }
                    }}
                  />
                ) : (
                  <Typography sx={{ 
                    fontFamily: 'Poppins', 
                    fontSize: '28px', 
                    fontWeight: 'bold',
                    color: '#091057'
                  }}>
                    {currentData.title}
                  </Typography>
                )}
              </Box>

              {/* Metadata */}
              <Box sx={{ display: 'flex', gap: 4, mb: 4, pb: 3, borderBottom: '1px solid #e0e0e0' }}>
                <Box>
                  <Typography sx={{ fontFamily: 'Poppins', fontSize: '12px', color: '#999', mb: 0.5 }}>
                    Created
                  </Typography>
                  <Typography sx={{ fontFamily: 'Poppins', fontSize: '14px', color: '#333' }}>
                    {new Date(currentData.createdAt).toLocaleString()}
                  </Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontFamily: 'Poppins', fontSize: '12px', color: '#999', mb: 0.5 }}>
                    Last Updated
                  </Typography>
                  <Typography sx={{ fontFamily: 'Poppins', fontSize: '14px', color: '#333' }}>
                    {new Date(currentData.updatedAt).toLocaleString()}
                  </Typography>
                </Box>
              </Box>

              {/* Content Section */}
              <Box>
                <Typography sx={{ 
                  fontFamily: 'Poppins', 
                  fontSize: '12px', 
                  color: '#999',
                  mb: 2
                }}>
                  CONTENT
                </Typography>
                {isEditMode ? (
                  <TextField
                    fullWidth
                    name="noteText"
                    value={updateData.noteText}
                    onChange={handleUpdateChange}
                    variant="outlined"
                    multiline
                    rows={8}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        fontFamily: 'Poppins',
                        fontSize: '16px',
                      }
                    }}
                  />
                ) : (
                  <Box sx={{
                    bgcolor: '#f9f9f9',
                    borderRadius: 2,
                    p: 3,
                    minHeight: 200,
                    border: '1px solid #e0e0e0'
                  }}>
                    <Typography sx={{ 
                      fontFamily: 'Poppins', 
                      fontSize: '16px',
                      lineHeight: 1.8,
                      color: '#333',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {currentData.noteText}
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog open={confirm} onClose={() => setConfirm(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontFamily: 'Poppins', fontWeight: 'bold', color: '#091057' }}>
          Delete Note?
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontFamily: 'Poppins' }}>
            Are you sure you want to delete "{selectedNote?.title}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => setConfirm(false)} 
            sx={{ 
              fontFamily: 'Poppins', 
              textTransform: 'none' 
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={confirmDeleteTask} 
            variant="contained"
            color="error"
            sx={{ 
              fontFamily: 'Poppins', 
              textTransform: 'none' 
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Transaction Confirmation Dialog */}
      <Dialog open={showTransactionDialog} onClose={handleCloseTransactionDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: "#091057", color: "white", fontFamily: "Poppins", fontWeight: "bold" }}>
          ✅ {transactionInfo?.type} Transaction Logged
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {transactionError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {transactionError}
            </Alert>
          )}
          {transactionInfo && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box>
                <Typography sx={{ fontWeight: "bold", color: "#091057", fontFamily: "Poppins" }}>Note Title:</Typography>
                <Typography sx={{ fontFamily: "Poppins" }}>{transactionInfo.noteTitle}</Typography>
              </Box>
              {transactionInfo.noteText && (
                <Box>
                  <Typography sx={{ fontWeight: "bold", color: "#091057", fontFamily: "Poppins" }}>Note Text:</Typography>
                  <Typography sx={{ fontFamily: "Poppins" }}>{transactionInfo.noteText}</Typography>
                </Box>
              )}
              <Box>
                <Typography sx={{ fontWeight: "bold", color: "#091057", fontFamily: "Poppins" }}>Action:</Typography>
                <Typography sx={{ fontFamily: "Poppins" }}>{transactionInfo.type}</Typography>
              </Box>
              <Box>
                <Typography sx={{ fontWeight: "bold", color: "#091057", fontFamily: "Poppins" }}>Transaction ID:</Typography>
                <Typography sx={{ wordBreak: "break-all", fontFamily: "monospace" }}>
                  {transactionInfo.transactionId}
                </Typography>
              </Box>
              <Box>
                <Typography sx={{ fontWeight: "bold", color: "#091057", fontFamily: "Poppins" }}>Network:</Typography>
                <Typography sx={{ fontFamily: "Poppins" }}>{transactionInfo.network}</Typography>
              </Box>
              <Box>
                <Typography sx={{ fontWeight: "bold", color: "#091057", fontFamily: "Poppins" }}>Fee:</Typography>
                <Typography sx={{ fontFamily: "Poppins" }}>{formatLovelaceToAda(transactionInfo.fee)}</Typography>
              </Box>
              <Box>
                <Typography sx={{ fontWeight: "bold", color: "#091057", fontFamily: "Poppins" }}>Wallet:</Typography>
                <Typography sx={{ fontFamily: "Poppins" }}>{transactionInfo.wallet}</Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTransactionDialog} sx={{ color: "#091057", fontFamily: "Poppins", textTransform: "none" }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default TaskUpdate;