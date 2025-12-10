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
import SearchIcon from '@mui/icons-material/Search';
import MenuIcon from '@mui/icons-material/Menu';
import FolderIcon from '@mui/icons-material/Folder';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Box, IconButton, Menu, MenuItem, Select, InputLabel, FormControl, TextField, Dialog, DialogActions, DialogContent, DialogTitle, Alert, Pagination, InputAdornment, Card, CardContent, Chip } from '@mui/material';
import Logo from "../assets/Logo1.png";

function TaskView() {

  const userId = localStorage.getItem('loggedInUserId');
  console.log('userId from localStorage:', userId);

  const [note, setNote] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const notesPerPage = 20;
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
  const [searchQuery, setSearchQuery] = useState('');
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

  useEffect(() => {
  const fetchTasks = async () => {
    if (!userId) return;
    try {
      const response = await axios.get(`http://localhost:8080/api/note/tasks?userId=${userId}`);
      const sortedNotes = (response.data || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setNote(sortedNotes);
    } catch (error) {
      console.error('Error fetching note:', error);
    }
  };
  fetchTasks();

}, []);

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
    const lovelace = BigInt(lovelaceAmount);
    const LOVELACE_PER_ADA = 1_000_000n;
    const ada = lovelace / LOVELACE_PER_ADA;
    const remainder = lovelace % LOVELACE_PER_ADA;
    let fractionalPart = remainder.toString().padStart(6, '0');
    const formattedAda = (Number(ada.toString() + "." + fractionalPart).toFixed(2));
    return `${formattedAda} ADA`;
  };

  const postNote = async (note) => {
  try {
    
    // --- REAL BACKEND CALLS ---
    const response = await axios.post('/api/note/post', note);
    const newNote = response.data.note;
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

    setNote(prevTasks => [newNote, ...prevTasks]);
    setNewNote({
      title: '',
      noteText: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      user: { userId: userId }
    });
    const res = await axios.get(`http://localhost:8080/api/note/tasks?userId=${userId}`);
    setNote(res.data || []);
    
  } catch (error) {
    console.error("Error posting task:", error);
  }
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

  const [anchorEl, setAnchorEl] = useState(null);
  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSortOrderChange = (order) => {
    setSortOrder(order);
    handleMenuClose();
  };

  const noteColors = ['#FFF9C4', '#FFCCBC', '#B3E5FC', '#C5E1A5', '#F8BBD0'];

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
          startIcon={<AddIcon />}
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
          onClick={handleAddTaskClick}
        >
          Add new
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
            MY NOTES
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              placeholder="Search"
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#999' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                width: '300px',
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: '#f5f5f5',
                  '& fieldset': { border: 'none' }
                }
              }}
            />
            
          </Box>
        </Box>

        {/* Alerts */}
        {walletError && (
          <Alert severity="error" sx={{ mx: 4, mt: 2 }} onClose={() => setWalletError('')}>
            {walletError}
          </Alert>
        )}
        {walletSuccess && (
          <Alert severity="success" sx={{ mx: 4, mt: 2 }} onClose={() => setWalletSuccess('')}>
            {walletSuccess}
          </Alert>
        )}

        {/* Content Area */}
        <Box sx={{ flex: 1, p: 4, overflow: 'auto' }}>
          {/* Recent Folders Section */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              
              <Box sx={{ display: 'flex', gap: 2 }}>
              
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              
            </Box>
          </Box>

          {/* My Notes Section */}
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography sx={{ fontWeight: 'bold', fontSize: '18px', fontFamily: 'Poppins', mr: 3 }}>
                  My Notes
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Chip label="Todays" size="small" />
                  <Chip label="This Week" size="small" variant="outlined" />
                  <Chip label="This Month" size="small" variant="outlined" />
                </Box>
              </Box>
             
            </Box>

            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              {note.slice((currentPage - 1) * notesPerPage, currentPage * notesPerPage).map((task, index) => (
                <Link 
                  to={`/taskdetails`} 
                  state={{ noteId: task.note_id }} 
                  style={{textDecoration:'none'}} 
                  key={task.note_id}
                >
                  <Card sx={{ 
                    width: 280, 
                    height: 180,
                    bgcolor: noteColors[index % noteColors.length],
                    borderRadius: 3,
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 3
                    }
                  }}>
                    <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                        <Typography sx={{ fontSize: '11px', color: '#666', fontFamily: 'Poppins' }}>
                          {new Date(task.createdAt).toLocaleDateString()}
                        </Typography>
                        <IconButton size="small">
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </Box>
                      <Typography sx={{ fontWeight: 'bold', fontFamily: 'Poppins', fontSize: '16px', mb: 1 }}>
                        {task.title}
                      </Typography>
                      <Typography sx={{ 
                        fontSize: '13px', 
                        color: '#555',
                        fontFamily: 'Poppins',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        flex: 1
                      }}>
                        {task.note_text}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
                        <Chip 
                          icon={<CheckCircleIcon sx={{ fontSize: 14 }} />} 
                          label="✓" 
                          size="small"
                          sx={{ 
                            height: 20,
                            bgcolor: 'rgba(0,0,0,0.1)',
                            '& .MuiChip-label': { px: 0.5 }
                          }}
                        />
                        <Typography sx={{ fontSize: '11px', color: '#666' }}>
                          {new Date(task.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Link>
              ))}
              
              {/* New Note Card */}
              <Card 
                onClick={handleAddTaskClick}
                sx={{ 
                  width: 280, 
                  height: 180,
                  border: '2px dashed #ccc',
                  bgcolor: 'transparent',
                  borderRadius: 3,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  '&:hover': {
                    bgcolor: '#f5f5f5'
                  }
                }}
              >
                <Box sx={{ textAlign: 'center' }}>
                  <AddIcon sx={{ fontSize: 40, color: '#999', mb: 1 }} />
                  <Typography sx={{ fontFamily: 'Poppins', color: '#999' }}>New Note</Typography>
                </Box>
              </Card>
            </Box>

            {/* Pagination */}
            <Box display="flex" justifyContent="center" mt={4}>
              <Pagination
                count={Math.ceil(note.length / notesPerPage)}
                page={currentPage}
                onChange={(_, value) => setCurrentPage(value)}
                color="primary"
              />
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Add Task Dialog */}
      <Dialog open={openAddDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ fontFamily: 'Poppins', fontWeight: 'bold' }}>Add New Note</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Note Title"
              fullWidth
              variant="outlined"
              value={newNote.title}
              onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Note Description"
              fullWidth
              multiline
              rows={4}
              variant="outlined"
              value={newNote.noteText}
              onChange={(e) => setNewNote({ ...newNote, noteText: e.target.value })}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleCloseDialog} sx={{ textTransform: 'none' }}>Cancel</Button>
            <Button 
              type='submit' 
              variant="contained"
              sx={{ 
                bgcolor: '#091057',
                textTransform: 'none',
                '&:hover': { bgcolor: '#0a1a6b' }
              }}
            >
              Add Note
            </Button>
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
    </Box>
  );
}

export default TaskView;