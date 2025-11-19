import * as React from 'react';
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
  const [newNote, setNewNote] = useState({
    title: '',
    noteText: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    user: { userId: userId },
  });
  const navigate = useNavigate();
  const token = localStorage.getItem('authToken');

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
            
            if (api) {
              // Get the wallet's unused addresses
              const unusedAddresses = await api.getUnusedAddresses();
              if (unusedAddresses && unusedAddresses.length > 0) {
                const address = unusedAddresses[0];
                
                // Store wallet info
                setWalletName(wallet);
                setWalletAddress(address);
                setWalletConnected(true);
                localStorage.setItem('connectedWallet', wallet);
                localStorage.setItem('walletAddress', address);
                
                setWalletSuccess(`✅ Connected to ${wallet.charAt(0).toUpperCase() + wallet.slice(1)} wallet! Address: ${address.substring(0, 20)}...`);
                connected = true;
                connectedWalletName = wallet;
                break;
              }
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

  const postNote = (note) => {
    axios.post('/api/note/post', note)
      .then(response => {
        const newNote = response.data;
        setNote(prevTasks => [...prevTasks, newNote]);
        setNewNote({
          title: '',
          noteText: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          user: { userId: userId }
        });
      })
      .catch(error => console.error("Error posting task:", error));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    postNote(newNote);
  };

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
