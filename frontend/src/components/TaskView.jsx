import * as React from 'react';
import initCardanoWasm from "@emurgo/cardano-serialization-lib-browser/cardano_serialization_lib_bg.wasm?init";
import {Blockfrost, WebWallet, Blaze, Core} from '@blaze-cardano/sdk'
import { useNavigate, Link, useParams } from 'react-router-dom';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useEffect, useState } from 'react';
import axios from 'axios';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import WalletIcon from '@mui/icons-material/Wallet';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Box, IconButton, Menu, MenuItem, Select, InputLabel, FormControl, TextField, Dialog, DialogActions, DialogContent, DialogTitle, Alert, Pagination, InputAdornment, Card, CardContent, Chip } from '@mui/material';
import Logo from "../assets/Logo1.png";
import SearchIcon from '@mui/icons-material/Search';
import MenuIcon from '@mui/icons-material/Menu';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { pollTx, sendTransaction } from '../blockchain';
import { loadNotes, saveNotes, upsertNote } from '../store';
import HistoryIcon from '@mui/icons-material/History';

function TaskView() {
  const noteColors = ['#FFF9C4', '#FFCCBC', '#B3E5FC', '#C5E1A5', '#F8BBD0'];
  const userId = localStorage.getItem('loggedInUserId');
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
  const [darkMode, setDarkMode] = useState(false);
const theme = createTheme({
  palette: {
    mode: darkMode ? 'dark' : 'light',
    background: {
      default: darkMode ? '#1e1e1e' : '#f5f5f5',
      paper: darkMode ? '#252525' : '#ffffff',
    },
    text: {
      primary: darkMode ? '#eaeaea' : '#000000',
    }
  },
});


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

    // Check localStorage first
    const storedWalletName = localStorage.getItem('connectedWallet');
    const storedWalletAddress = localStorage.getItem('walletAddress');

    if (storedWalletName && storedWalletAddress) {
      setWalletName(storedWalletName);
      setWalletAddress(storedWalletAddress);
      setWalletConnected(true);
      setWalletSuccess(`Restored connection to ${storedWalletName}`);
      
      // Optionally fetch notes for this wallet
      const res = await axios.get(
        `http://localhost:8080/api/note/get/by-wallet/${storedWalletAddress}`
      );
      setNote(res.data);

      return; // Skip connecting again
    }

    // Try to connect to wallets if nothing in localStorage
    const walletOptions = ['lace', 'eternl', 'flint', 'nami'];
    let connected = false;
    let connectedWalletName = '';

    for (const wallet of walletOptions) {
      if (window.cardano[wallet]) {
        try {
          const api = await window.cardano[wallet].enable();
          setWalletApi(api);
          if (api) {
            const walletAddr = await api.getChangeAddress();
            setWalletAddress(walletAddr);
            setWalletName(wallet);
            setWalletConnected(true);

            // Save to localStorage
            localStorage.setItem('connectedWallet', wallet);
            localStorage.setItem('walletAddress', walletAddr);
            localStorage.setItem('walletConnected', 'true');
            localStorage.setItem('walletName', wallet);

            // Fetch notes
            const res = await axios.get(
              `http://localhost:8080/api/note/get/by-wallet/${walletAddr}`
            );
            setNote(res.data);

            connected = true;
            connectedWalletName = wallet;
            break;
          }
        } catch (err) {
          console.log(`Could not connect to ${wallet}:`, err.message);
          continue;
        }
      }
    }

    if (!connected) {
      setWalletError('No Cardano wallet found or permission denied. Please install Lace, Eternl, Flint, or Nami wallet extension.');
    } else {
      setWalletSuccess(`Connected to ${connectedWalletName}`);
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

useEffect(() => {
  const fetchTasks = async () => {
    if (!walletAddress) return; // no wallet connected, skip fetching

    try {
      const response = await axios.get(`http://localhost:8080/api/note/get/by-wallet/${walletAddress}`);
      const sortedNotes = (response.data || []).sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setNote(sortedNotes);
    } catch (error) {
      console.error('Error fetching note:', error);
    }
  };

  fetchTasks();
}, [walletAddress]);


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
    // 1. Run blockchain transaction
    const txResult = await handleSubmitTransaction(note);

    // If transaction failed, stop
    if (!txResult) {
      console.error("Transaction failed — note will not be posted.");
      return;
    }

    // 2. Send to backend using txResult.transactionId
    const response = await axios.post(
      `http://localhost:8080/api/note/post?walletAddress=${walletAddress}&txhash=${txResult.transactionId}`,
      {
        title: note.title,
        noteText: note.noteText
      }
    );

    const newNote = response.data.note ?? response.data;

    // 3. Show transaction dialog
    setTransactionInfo({
      type: 'CREATE',
      noteTitle: newNote.title,
      transactionId: txResult.transactionId,
      network: provider.network,
      fee: txResult.amount,
      wallet: localStorage.getItem('connectedWallet')
    });

    setShowTransactionDialog(true);

    // 4. Update UI
    setNote(prev => [newNote, ...prev]);

    // 5. Reset form
    setNewNote({
      title: '',
      noteText: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      user: { userId }
    });
      
    // 6. Refresh notes by wallet
    const res = await axios.get(
      `http://localhost:8080/api/note/get/by-wallet/${walletAddress}`
    );
    setNote(res.data);

  } catch (error) {
    console.error("Error posting task:", error);
  }
};


  const handleSubmit = (e) => {
    e.preventDefault();
    postNote(newNote);
  };

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
  <ThemeProvider theme={theme}>
    <Box sx={{ 
  display: 'flex', 
  minHeight: '100vh', 
  bgcolor: darkMode ? '#1e1e1e' : '#f5f5f5'
}}>


      {/* Sidebar */}
      <Box sx={{ 
        width: '250px', 
        bgcolor: 'white', 
        borderRight: '1px solid #e0e0e0',
        display: 'flex',
        flexDirection: 'column',
        p: 3
      }}>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>

  {/* ALL */}
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      p: 1,
      cursor: 'pointer',
      borderRadius: 1,
      transition: 'transform 0.15s ease-in-out',
      '&:hover': {
        bgcolor: '#f5f5f5',
        transform: 'scale(1.03)',
      },
    }}
  >
    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#4CAF50' }} />
    <Typography sx={{ fontFamily: 'Poppins', fontSize: '14px' }}>All</Typography>
  </Box>

  {/* PERSONAL */}
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      p: 1,
      cursor: 'pointer',
      borderRadius: 1,
      transition: 'transform 0.15s ease-in-out',
      '&:hover': {
        bgcolor: '#f5f5f5',
        transform: 'scale(1.03)',
      },
    }}
  >
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#2196F3' }} />
          <Typography sx={{ fontFamily: 'Poppins', fontSize: '14px' }}>Personal</Typography>
        </Box>

        {/* WORK */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            p: 1,
            cursor: 'pointer',
            borderRadius: 1,
            transition: 'transform 0.15s ease-in-out',
            '&:hover': {
              bgcolor: '#f5f5f5',
              transform: 'scale(1.03)',
            },
          }}
        >
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
            transition: 'transform 0.15s ease-in-out',
            '&:hover': {
              backgroundColor: walletConnected ? '#b71c1c' : '#0a1a6b',
              transform: 'scale(1.05)',
            }
          }}

            onClick={walletConnected ? handleDisconnectWallet : handleSyncWallet}
          >
            {walletConnected ? 'Disconnect Wallet' : 'Sync Wallet'}
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
                transition: 'transform 0.15s ease-in-out',
                '&:hover': {
                  transform: 'scale(1.03)',    // search hover effect
                },
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: '#f5f5f5',
                  '& fieldset': { border: 'none' }
                }
              }}

            />
            <Button
              component={Link}
              to="/transactions"
              startIcon={<HistoryIcon />}
              variant="contained"
              sx={{
                bgcolor: '#091057',
                color: 'white',
                textTransform: 'none',
                transition: 'transform 0.15s ease-in-out',
                '&:hover': {
                  bgcolor: '#0a1a6b',
                  transform: 'scale(1.05)',   // expand on hover
                }
              }}

            >
              Transaction History
                      </Button>
                      <Button
            variant="contained"
            onClick={() => setDarkMode(prev => !prev)}
            sx={{
              bgcolor: darkMode ? '#333' : '#091057',
              color: 'white',
              textTransform: 'none',
              ml: 1,
              transition: 'transform 0.15s ease-in-out',
              '&:hover': {
                bgcolor: darkMode ? '#444' : '#0a1a6b',
                transform: 'scale(1.05)',
              }
            }}
          >
            {darkMode ? "Light Mode" : "Dark Mode"}
          </Button>

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
                <Typography 
                sx={{ 
                  fontWeight: 'bold', 
                  fontSize: '18px', 
                  fontFamily: 'Poppins', 
                  mr: 3,
                  color: darkMode ? '#ffffff' : '#000000'
                }}
              >
                My Notes
              </Typography>

                <Box sx={{ display: 'flex', gap: 2 }}>

                  <Chip
                    label="Todays"
                    size="small"
                    sx={{
                      transition: 'transform 0.15s ease-in-out',
                      cursor: 'pointer',
                      '&:hover': {
                        transform: 'scale(1.03)',
                      },
                    }}
                  />

                  <Chip
                    label="This Week"
                    size="small"
                    variant="outlined"
                    sx={{
                      transition: 'transform 0.15s ease-in-out',
                      cursor: 'pointer',
                      '&:hover': {
                        transform: 'scale(1.03)',
                      },
                    }}
                  />

                  <Chip
                    label="This Month"
                    size="small"
                    variant="outlined"
                    sx={{
                      transition: 'transform 0.15s ease-in-out',
                      cursor: 'pointer',
                      '&:hover': {
                        transform: 'scale(1.03)',
                      },
                    }}
                  />

                </Box>

              </Box>
             
            </Box>

            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              {note.slice((currentPage - 1) * notesPerPage, currentPage * notesPerPage).map((task, index) => (
                <Link 
                  to={`/taskdetails/${task.noteId}`} 
                  style={{textDecoration:'none'}} 
                  key={task.noteId}
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
                onClick={walletConnected ? handleAddTaskClick : undefined}
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
                transition: 'transform 0.15s ease-in-out',
                '&:hover': {
                  bgcolor: '#f5f5f5',
                  transform: 'scale(1.03)',   // slight enlarge
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
                sx={{
                    '& .MuiPaginationItem-page': {
                        color: 'white',   // only numbers, NOT arrows
                      }
                  }}
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
                color: 'white',
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
    </ThemeProvider>
  );
}

export default TaskView;
