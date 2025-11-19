import * as React from 'react';
import initCardanoWasm from "@emurgo/cardano-serialization-lib-browser/cardano_serialization_lib_bg.wasm?init";
import {Blockfrost, WebWallet, Blaze, Core} from '@blaze-cardano/sdk'
import { useNavigate, Link, useParams } from 'react-router-dom';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import axios from 'axios';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import WalletIcon from '@mui/icons-material/Wallet';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Box, IconButton, Menu, MenuItem, Select, InputLabel, FormControl, TextField, Dialog, DialogActions, DialogContent, DialogTitle, Alert } from '@mui/material';
import Logo from "../assets/Logo1.png";

function TaskView() {

  const userId = localStorage.getItem('loggedInUserId'); //
  console.log('userId from localStorage:', userId);

  const [note, setNote] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [filterStatus, setFilterStatus] = useState('All');
  const [sortOrder, setSortOrder] = useState('asc');
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [walletName, setWalletName] = useState('');
  const [walletError, setWalletError] = useState('');
  const [walletSuccess, setWalletSuccess] = useState('');
  const [walletApi, setWalletApi] = useState();
  const [newNote, setNewNote] = useState({
    title: '',
    noteText: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    user: { userId: userId },
  });
  const [transactionInfo, setTransactionInfo] = useState(null);
  const [showTransactionDialog, setShowTransactionDialog] = useState(false);
  const [transactionError, setTransactionError] = useState('');
  const navigate = useNavigate();
  const token = localStorage.getItem('authToken');
  const [provider] = useState(() => new Blockfrost({
    network: 'cardano-preview',
    projectId: import.meta.env.VITE_BLOCKFROST_PROJECT_ID,
  }))
  // Check for previously connected wallet on component mount
  useEffect(() => {
    const storedWalletName = localStorage.getItem('connectedWallet');
    const storedWalletAddress = localStorage.getItem('walletAddress');
    if (storedWalletName && storedWalletAddress) {
      setWalletName(storedWalletName);
      setWalletAddress(storedWalletAddress);
      setWalletConnected(true);
    }
  }, []);

  const hexToBech32 = async (hex) => {
    const CardanoWasm = await initCardanoWasm();
    const addr = CardanoWasm.Address.from_bytes(Buffer.from(hex, "hex"));
    return addr.to_bech32();
  };

  // Function to sync/connect wallet using CIP-0030 standard
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
            if (api) {
              // Get the wallet's unused addresses
              const walletAddress = await api.getChangeAddress();
              console.log("Wallet Address: ",walletAddress);
              setWalletAddress(walletAddress);
            }
          } catch (error) {
            // User rejected permission or other error, try next wallet
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

  useEffect(() => {
  const fetchTasks = async () => {
    if (!userId) {
      console.error('UserId is missing');
      return;
    }

    try {
      const response = await axios.get(`http://localhost:8080/api/note/tasks?userId=${userId}`);
      setNote(response.data || []);
    } catch (error) {
      console.error('Error fetching note:', error);
    }
  };

  fetchTasks();
}, [userId]);

  const handleAddTaskClick = () => {
    setOpenAddDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenAddDialog(false);
  };


  const handleCloseTransactionDialog = () => {
    setShowTransactionDialog(false);
    setTransactionInfo(null);
    setTransactionError('');
  };
  const formatLovelaceToAda = (lovelaceAmount) => {
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
};
  const postNote = async (note) => {
    try {
      const response = await axios.post('/api/note/post', note);
      const newNote = response.data;
        const txResult = await handleSubmitTransaction();
        setTransactionInfo({
          type: 'CREATE',
          noteTitle: newNote.title,
          transactionId: txResult.transactionId,
          network: provider.network,
          fee: txResult.amount,
          wallet: localStorage.getItem('connectedWallet')
        });
        setShowTransactionDialog(true);
      
      setNote(prevTasks => [...prevTasks, newNote]);
      setNewNote({
        title: '',
        noteText: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        user: { userId: userId }
      });
    } catch (error) {
      console.error("Error posting task:", error);
      
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    postNote(newNote);
  };

  const handleSubmitTransaction = async () =>{
    // Define the Lovelace amount here, or pass it as a parameter
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
            lovelaceAmount, // Use defined variable
        )
        .complete();
        console.log("Transaction: ",tx.toCbor());
        const signexTx = await blaze.signTransaction(tx);

        // Step #7
        // Submit the transaction to the blockchain network
        const txId = await blaze.provider.postTransactionToChain(signexTx);

        // Optional: Print the transaction ID
        console.log("Transaction ID", txId);
        
        // SUCCESS PATH: Return the transaction object
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "userId") {
      setNewNote(prevTask => ({
        ...prevTask,user: { userId: value }
      }));
    } else {
      setNewNote(prevTask => ({
        ...prevTask,
        [name]: value,
      }));
    }
  };

  // Menu handling for filtering and sorting
  const [anchorEl, setAnchorEl] = useState(null);
  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSortOrderChange = (order) => {
    setSortOrder(order);
    handleMenuClose();  // Close the menu after sorting
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" bgcolor="#091057" padding={2} color="white">
        <Link to="/tasks">
          <Button sx={{ width: 'auto', mr: 1 }}><img src={Logo} alt="Logo" style={{ maxWidth: "60px" }} /></Button>
        </Link>
        <Box display="flex" gap={3}>
          <Link to="/tasks" style={{textDecoration:'none'}}>
            <Typography sx={{ color: "white", fontFamily: "Poppins", fontSize: "16px", cursor: "pointer", textDecoration: "none", fontWeight: "bold" }}>
              Home
            </Typography>
          </Link>
          <Link to="/login" style={{textDecoration:'none'}}>
            <Typography sx={{ color: "white", fontFamily: "Poppins", fontSize: "16px", cursor: "pointer", textDecoration: "none", fontWeight: "bold" }} onClick={() => {
              localStorage.removeItem('authToken');
              localStorage.removeItem('loggedInUserId');
              navigate('/login');
            }}>
              Logout
            </Typography>
          </Link>
        </Box>
      </Box>

      <Box flex="1" padding={4}>
      {/* Wallet Status Alert */}
      {walletError && (
        <Alert severity="error" sx={{ marginBottom: 2 }} onClose={() => setWalletError('')}>
          {walletError}
        </Alert>
      )}
      {walletSuccess && (
        <Alert severity="success" sx={{ marginBottom: 2 }} onClose={() => setWalletSuccess('')}>
          {walletSuccess}
        </Alert>
      )}

      <Box display="flex" justifyContent="space-between" alignItems="center">
  <IconButton onClick={() => navigate("/todos")}>
    <ArrowBackIcon sx={{ color: "#091057" }} />
  </IconButton>
  <Typography sx={{ fontFamily: "Poppins", fontSize: "24px", fontWeight: "bold", color: "primary" }}>
    List
  </Typography>
  <Box sx={{ marginLeft: "auto", display: "flex", gap: 2 }}>
    <Button
      variant="contained"
      startIcon={walletConnected ? <CheckCircleIcon /> : <WalletIcon />}
      sx={{
        backgroundColor: walletConnected ? "#4CAF50" : "#2196F3",
        color: "white",
        fontFamily: "Poppins",
        textTransform: "none",
      }}
      onClick={handleSyncWallet}
      title={walletConnected ? `Connected to ${walletName}` : "Click to sync wallet"}
    >
      {walletConnected ? `Wallet: ${walletName}` : "Sync to Wallet"}
    </Button>
    <Button
      variant="contained"
      startIcon={<AddIcon />}
      sx={{
        backgroundColor: "#EC8305",
        color: "white",
        fontFamily: "Poppins",
        textTransform: "none",
      }}
      onClick={handleAddTaskClick}
    >
      Add Note
    </Button>
    <Button
      variant="contained"
      startIcon={<AddIcon />}
      sx={{
        backgroundColor: "#EC8305",
        color: "white",
        fontFamily: "Poppins",
        textTransform: "none",
      }}
      onClick={handleSubmitTransaction}
    >
      Test Transaction
    </Button>
  </Box>
</Box>
              
        {/* Task Cards */}
        <Box display="flex" gap={3} flexWrap="wrap" >
        {note.map((task) => (
  <Link to={`/taskdetails`} state={{ noteId: task.noteId }} onClick={(event) => event.stopPropagation()} style={{textDecoration:'none'}} key={task.noteId}>
    <Box width="300px" padding={2} bgcolor="#F1F0E8" borderRadius="8px" boxShadow={2} sx={{ cursor: "pointer" }}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h6" fontFamily="Poppins" fontWeight="bold" color="#091057">
          {task.title}
        </Typography>
      </Box>
      <Typography color="#EC8305" fontFamily="Poppins" fontSize="14px" marginTop={1}>
        {task.noteText}    
      </Typography>
    </Box>
  </Link>
))}
        </Box>
      </Box>

      {/* Add Task Dialog */}
      <Dialog open={openAddDialog} onClose={handleCloseDialog}>
        <form onSubmit={handleSubmit}>
          <DialogTitle>Add New Note</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Task Title"
              fullWidth
              variant="outlined"
              value={newNote.title}
              onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
            />
            <TextField
              margin="dense"
              label="Task Description"
              fullWidth
              variant="outlined"
              value={newNote.noteText}
              onChange={(e) => setNewNote({ ...newNote, noteText: e.target.value })}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type='submit'>Add Task</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Transaction Dialog */}
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
                <Typography sx={{ fontWeight: "bold", color: "#091057" }}>Task:</Typography>
                <Typography>{transactionInfo.noteTitle}</Typography>
              </Box>
              <Box>
                <Typography sx={{ fontWeight: "bold", color: "#091057" }}>Action:</Typography>
                <Typography>{transactionInfo.type}</Typography>
              </Box>
              <Box>
                <Typography sx={{ fontWeight: "bold", color: "#091057" }}>Transaction ID:</Typography>
                <Typography sx={{ wordBreak: "break-all", fontFamily: "monospace" }}>
                  {transactionInfo.transactionId}
                </Typography>
              </Box>
              <Box>
                <Typography sx={{ fontWeight: "bold", color: "#091057" }}>Network:</Typography>
                <Typography>{transactionInfo.network}</Typography>
              </Box>
              <Box>
                <Typography sx={{ fontWeight: "bold", color: "#091057" }}>Fee:</Typography>
                <Typography>{formatLovelaceToAda(transactionInfo.fee)}</Typography>
              </Box>
              <Box>
                <Typography sx={{ fontWeight: "bold", color: "#091057" }}>Wallet:</Typography>
                <Typography>{transactionInfo.wallet}</Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTransactionDialog} sx={{ color: "#091057" }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Box
        bgcolor="#091057"
        padding={3}
        color="white"
        display="flex"
        flexDirection="column"
        alignItems="center"
        marginTop="auto"
      >
        <Box display="flex" gap={3} marginBottom={2}>
          <Typography component="button">
            <i className="fab fa-facebook" style={{ color: "white", fontSize: "20px" }}></i>
          </Typography>
          <Typography component="button">
            <i className="fab fa-instagram" style={{ color: "white", fontSize: "20px" }}></i>
          </Typography>
          <Typography component="button">
            <i className="fab fa-twitter" style={{ color: "white", fontSize: "20px" }}></i>
          </Typography>
        </Box>
        <Box display="flex" gap={3} fontFamily="Poppins" fontSize="14px">
          <Typography>Home</Typography>
          <Typography>About</Typography>
          <Typography>Team</Typography>
          <Typography>Services</Typography>
          <Typography>Contact</Typography>
        </Box>
      </Box>
    </div>
  );
}

export default TaskView;
