import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Typography from '@mui/material/Typography';
import { TextField, Button, Container, Box, Paper, IconButton, Alert } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import {Blockfrost, WebWallet, Blaze, Core} from '@blaze-cardano/sdk'
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Tooltip from '@mui/material/Tooltip';
import EditIcon from '@mui/icons-material/Edit';
import { Link } from 'react-router-dom';
import Logo from "../assets/Logo1.png"
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { Select, MenuItem, FormControl, InputLabel, Card, CardContent } from '@mui/material';
import * as React from 'react';

function TaskDetails() {
  
  const navigate = useNavigate();
  const location = useLocation();
  const { noteId } = useParams();  // Get taskId from URL
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDialogOpenUpdate, setIsDialogOpenUpdate] = useState(false);
  const [walletConnected, setWalletConnected] = useState(localStorage.getItem('walletConnected') === 'true');
  const [walletName, setWalletName] = useState(localStorage.getItem('walletName') || '');
  const [walletAddress, setWalletAddress] = useState(localStorage.getItem('walletAddress') || '');
  const [confirm, setConfirm] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
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
  const [darkMode, setDarkMode] = useState(
  localStorage.getItem("darkMode") === "true"
);


  const [transactionInfo, setTransactionInfo] = useState(null);
  const [showTransactionDialog, setShowTransactionDialog] = useState(false);
  const [transactionError, setTransactionError] = useState('');

console.log('noteId from location.state:', noteId);
  const token = localStorage.getItem('authToken');
  const userId = localStorage.getItem('loggedInUserId');

  const authHeaders = () => {
    if (!token) {
      navigate('/login');  // Redirect to login if token is missing
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
  const fetchWallet = async () => {
    try {
      if (window.cardano?.lace) {
        const api = await window.cardano.lace.enable();
        setWalletApi(api);
        setWalletConnected(true); // <- mark wallet as connected
        setWalletAddress(localStorage.getItem('walletAddress'));
        setWalletName(localStorage.getItem('connectedWallet') || 'Wallet');
      } else {
        setWalletConnected(false);
      }
    } catch (error) {
      console.error("Wallet connection failed", error);
      setWalletConnected(false);
    }
  };
  fetchWallet();
}, []);
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

  const handleSyncWallet = async () => {
   
    try {
      setWalletError('');
      setWalletSuccess('');
  
      // Check if Cardano object exists
      if (!window.cardano) {
        setWalletError('Cardano object not found. Please ensure a Cardano wallet extension is installed.');
        return;
      }
  
      // Try to connect to Lace wallet first, then fallback to other wallets
      const walletOptions = ['lace', 'eternl', 'flint', 'nami'];
      let connected = false;
      let connectedWalletName = '';
  
      for (const wallet of walletOptions) {
        if (window.cardano[wallet]) {
          try {
            // This is the CIP-0030 enable() method that asks for permission
            const api = await window.cardano[wallet].enable();
            setWalletApi(api);
            console.log("WalletAPI: ", api);
            if (api) {
              // Get the wallet's unused addresses
              const walletAddress = await api.getChangeAddress();
              console.log("Wallet Address: ", walletAddress);
              setWalletAddress(walletAddress);
              setWalletName(wallet);
              setWalletConnected(true);
              const res = await axios.get(
                `http://localhost:8080/api/note/get/by-wallet/${walletAddress}`
              );
              setNote(res.data);
              localStorage.setItem('connectedWallet', connectedWalletName);
              localStorage.setItem('walletAddress', walletAddress);
              localStorage.setItem('walletConnected', 'true');
              localStorage.setItem('walletName', walletName);
            }
            connected = true;
            connectedWalletName = wallet;
            break;
          } catch (error) {
            // User rejected permission or other error, try next wallet
            console.log(`Could not connect to ${wallet}:`, error.message);
            continue;
          }
        }
      }
  
      if (!connected) {
        setWalletError('No Cardano wallet found or permission denied. Please install Lace, Eternl, Flint, or Nami wallet extension.');
      } else {
        setWalletSuccess(`Connected to ${connectedWalletName}`);
        localStorage.setItem('connectedWallet', connectedWalletName);
        localStorage.setItem('walletAddress', walletAddress);
      }
    } catch (error) {
      console.error('Error syncing wallet:', error);
      setWalletError(`Error: ${error.message || 'Failed to sync wallet'}`);
    }
  };
  
  const handleDisconnectWallet = () => {
    // Remove ALL wallet data from localStorage
    localStorage.removeItem('connectedWallet');
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('walletConnected');
    localStorage.removeItem('walletName');
    // Reset state
    setWalletConnected(false);
    setWalletName('');
    setWalletAddress('');
    setWalletApi(null);
  
    // Clear notes
    setNote([]);
  
    setWalletSuccess('Wallet disconnected successfully!');
  };

const formatLovelaceToAda = (lovelaceAmount) => {
    // Handle non-numeric values
    if (typeof lovelaceAmount === 'string' && isNaN(lovelaceAmount)) {
        return lovelaceAmount; // Return as-is if it's "Simulated" or other string
    }
    
    try {
        // Ensure the input is treated as a BigInt
        const lovelace = BigInt(lovelaceAmount);
        
        // The divisor for 1 ADA
        const LOVELACE_PER_ADA = 1_000_000n;
        
        // Calculate ADA value (integer part)
        const ada = lovelace / LOVELACE_PER_ADA;
        
        // Calculate the remainder (decimal part, in Lovelace)
        const remainder = lovelace % LOVELACE_PER_ADA;
        
        // Format the remainder to ensure it has 6 digits (for .000000)
        let fractionalPart = remainder.toString().padStart(6, '0');
        
        // Truncate to two significant digits (e.g., "000000" -> "00", "500000" -> "50")
        // Use Number() to parse and localeString for proper decimal/comma handling
        const formattedAda = (Number(ada.toString() + "." + fractionalPart)
            .toFixed(2)); // Display 2 decimal places

        return `${formattedAda} ADA`;
    } catch (error) {
        console.error("Error formatting lovelace:", error);
        return "N/A";
    }
};
// start of update functions

// Generate a simulated transaction hash (UUID format without dashes)
const formatContent = (content) => {
    // CASE 1: SHORT STRING (FITS IN ONE CHUNK)
    if (content.length <= 64) {
      return Core.Metadatum.newText(content);
    }

    // CASE 2: LONG STRING (NEEDS SPLITTING)
    // REGEX SPLITS THE STRING EVERY 64 CHARACTERS
    const chunks = content.match(/.{1,64}/g) || [];
    const list = new Core.MetadatumList();
    
    chunks.forEach(chunk => {
      list.add(Core.Metadatum.newText(chunk));
    });

    return Core.Metadatum.newList(list);
  };

const handleSubmitTransaction = async (note) =>{
    // Define the Lovelace amount here, or pass it as a parameter
    const lovelaceAmount = 1_000_000n; 
    
    if(walletApi){
      try{
        const wallet = new WebWallet(walletApi)
        const blaze= await Blaze.from(provider,wallet)
        console.log("Blaze instance created!", blaze);
        const bench32Address = Core.Address.fromBytes(Buffer.from(walletAddress, 'hex')).toBech32;
        console.log("Recipient Address (bech32): ",bench32Address);
        let tx = await blaze
        .newTransaction()
        .payLovelace(
          Core.Address.fromBech32(
            "addr_test1qq3ets7dxg8aure96num4zz7asrmy9nr8kgsy6t3jfdhv9yrv4w2has733mkknfv0q9ugh3vum305c5ywd65gmg5sn0qncs98a"
          ),
          lovelaceAmount
        );

      // Add metadata
      const metadata = new Map();
      const label = 400129n;
      const metadatumMap = new Core.MetadatumMap();
      metadatumMap.insert(
        Core.Metadatum.newText("note"),
        formatContent(note.noteText || "")
      );
      metadatumMap.insert(
        Core.Metadatum.newText("created_at"),
        Core.Metadatum.newText(new Date().toISOString())
      );
      metadata.set(label, Core.Metadatum.newMap(metadatumMap));
      tx.setMetadata(new Core.Metadata(metadata));

      // Complete, sign, and submit
      const completedTx = await tx.complete();  // 🔑 this will select UTxOs and compute fees
      const signedTx = await blaze.signTransaction(completedTx);
      const txId = await blaze.provider.postTransactionToChain(signedTx);

      console.log("Transaction ID:", txId);
      handleSyncWallet();
      return {
        transactionId: txId,
        amount: lovelaceAmount,
      };

      }
      catch(error){
        console.error("Error submitting transaction:",error);
        // ERROR PATH: Return a clear value (like null) instead of nothing
        return null; 
      }
    }
    // WALLET NOT CONNECTED PATH: Return a clear value instead of nothing
    return null; 
}

   

const updateTask = async (note) => {
  try {
    let txResult;
    let txhash;

    // STEP 1: Try real blockchain transaction
    try {
      txResult = await handleSubmitTransaction(note);   // real update tx
      txhash = txResult.transactionId;
      console.log(`Real transaction successful: ${txhash}`);
    } catch (txError) {
      console.error("Blockchain transaction failed → aborting update:", txError.message);
      setTransactionError("Transaction failed. Note was NOT updated.");
      return; // ⛔ STOP — DO NOT UPDATE
    }

    const walletAddr = localStorage.getItem("walletAddress");

    console.log(`Updating note with txhash: ${txhash}`);

    // STEP 2: Only call backend update if blockchain tx succeeded
    const response = await axios.put(
      `/api/note/put/${note.noteId}?walletAddress=${walletAddr}&txhash=${txhash}`,
      note
    );

    console.log("Note updated successfully:", response.data);

    // STEP 3: Show transaction confirmation
    setTransactionInfo({
      type: "UPDATE",
      noteTitle: note.title,
      noteText: note.noteText,
      transactionId: txhash,
      network: provider.network,
      fee: "1.0 ADA",
      wallet: localStorage.getItem("connectedWallet"),
      isSimulated: false
    });
    setShowTransactionDialog(true);

    // STEP 4: Update UI state
    const updatedNote = response.data.note;

    setCurrentData(prev => ({
      ...prev,
      title: updatedNote.title,
      noteText: updatedNote.noteText,
      updatedAt: new Date().toISOString(),
      txhash: txhash
    }));

    setUpdateData(prev => ({
      ...prev,
      title: updatedNote.title,
      noteText: updatedNote.noteText,
      updatedAt: new Date().toISOString(),
      txhash: txhash
    }));

  } catch (error) {
    console.error("Error updating note:", error);
    setTransactionError("Error updating note: " + error.message);
    handleSyncWallet();
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

// end of update functions
// start of comment update
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('loggedInUserId');
    navigate('/login');
  };

  // Function to log transaction to blockchain
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

 const confirmDeleteTask = async () => {
  if (!selectedNote?.noteId) return;

  try {
    let txResult;
    let txhash;

    // STEP 1: Try real blockchain transaction
    try {
      txResult = await handleSubmitTransaction(selectedNote);    // real tx only
      txhash = txResult.transactionId;
      console.log(`Real transaction successful: ${txhash}`);
    } catch (txError) {
      console.error("Blockchain transaction failed → aborting delete:", txError.message);
      setTransactionError("Transaction failed. Note was NOT deleted.");
      setConfirm(false);
      return;   // ⛔ STOP HERE — DO NOT DELETE
    }

    // STEP 2: If real transaction succeeded → perform backend deletion
    const walletAddr = localStorage.getItem("walletAddress");

    console.log("Deleting note with txhash:", txhash);
    const response = await axios.delete(
      `/api/note/delete/${selectedNote.noteId}?walletAddress=${walletAddr}&txhash=${txhash}`
    );

    console.log("Note deleted successfully:", response.data);

    // STEP 3: Show transaction confirmation
    setTransactionInfo({
      type: "DELETE",
      noteTitle: selectedNote.title,
      transactionId: txhash,
      network: provider.network,
      fee: "1.0 ADA",
      wallet: localStorage.getItem("connectedWallet"),
      isSimulated: false
    });
    setShowTransactionDialog(true);

    setTimeout(() => {
      navigate(`/tasks`);
      setConfirm(false);
    }, 2000);

  } catch (error) {
    console.error("Error deleting task:", error);
    setTransactionError("Error deleting task: " + error.message);
    setConfirm(false);
  }
};


    return (
    <Box 
  sx={{ 
    display: 'flex', 
    minHeight: '100vh', 
    bgcolor: darkMode ? '#1e1e1e' : '#f5f5f5'
  }}
>

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
              backgroundColor: walletConnected ? '#d32f2f' : '#091057',
              color: 'white',
              fontFamily: 'Poppins',
              textTransform: 'none',
              fontSize: '11px',
              py: 0.5,
              '&:hover': {
                backgroundColor: walletConnected ? '#b71c1c' : '#0a1a6b'
              }
            }}
            onClick={walletConnected ? handleDisconnectWallet : handleSyncWallet}
          >
            {walletConnected ? 'Disconnect Wallet' : 'Sync Wallet'}
          </Button>
          </Box>
        </Box>
      </Box>
{/* marker */}
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
            {!isDialogOpenUpdate ? (
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
                  onClick={() => setIsDialogOpenUpdate(true)}
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
                    setIsDialogOpenUpdate(false);
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
            boxShadow: 2,
            bgcolor: darkMode ? '#2b2b2b' : 'white',  // DARK MODE CARD
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
                {isDialogOpenUpdate ? (
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
                {isDialogOpenUpdate ? (
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
                      bgcolor: darkMode ? '#3a3a3a' : '#f9f9f9',
                      borderRadius: 2,
                      p: 3,
                      minHeight: 200,
                      border: '1px solid #444',
                    }}>

                    <Typography sx={{
                      fontFamily: 'Poppins',
                      fontSize: '16px',
                      lineHeight: 1.8,
                      color: darkMode ? '#e6e6e6' : '#333',
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
      {/* end of marker */}
       </Box>
  );
}

export default TaskDetails;
