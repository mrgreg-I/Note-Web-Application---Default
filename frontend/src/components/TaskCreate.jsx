import { useState } from 'react';
import axios from 'axios';

import { useNavigate, Link, useLocation } from 'react-router-dom';
import { ThemeProvider } from '@emotion/react';
import { createTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import { TextField, Button, Container, Box, Paper } from '@mui/material';
import Grid from '@mui/material/Grid2';
import ChecklistIcon from '@mui/icons-material/Checklist';

// Define Material UI theme
const theme = createTheme({
  typography: {
    h2: {
      color: 'black',
      textAlign: 'center',  // Center the heading text
    },
    button: {
      color: 'yellow'
    }
  },
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#f50057',
    },
  },
});

function TaskCreate() {
  const location = useLocation();
  const { userId } = location.state || {}; // Retrieve toDoListId from location state
  const [newNote, setNewNote] = useState({
    title: '',
    noteText: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    user: { userId: userId },
  });

  const [submittedNote, setSubmittedNote] = useState(null);
  const [walletAddress, setWalletAddress] = useState("");
  const [walletApi, setWalletApi] = useState(null);
  const [blockchainLogStatus, setBlockchainLogStatus] = useState(null);
  const [provider] = useState(() => new (window.Blockfrost || {})({
    network: 'cardano-preview',
    projectId: import.meta.env.VITE_BLOCKFROST_PROJECT_ID,
  }));

  // Generate simulated transaction hash
  const generateSimulatedTxHash = () => {
    return 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'.replace(/x/g, () => {
      return Math.floor(Math.random() * 16).toString(16);
    });
  };

  // Function to log transaction to blockchain
  const logTransactionToBlockchain = (note) => {
    if (!walletAddress) {
      setBlockchainLogStatus("Wallet address required for blockchain logging.");
      return;
    }
    const api = window.cardano[walletAddress].enable();
    setWalletApi(api);
    console.log("Wallet API initialized:", api);
    const address= api.getChangeAddress();
    console.log("Using wallet address:", address);
    const payload = {
      noteId: note.noteId,
      walletAddress: address,
      noteTitle: note.title
    };
    console.log("Blockchain payload:", payload);
    axios.post('http://localhost:8080/api/blockchain/simulate-note-transaction', payload)
      .then(res => {
        setBlockchainLogStatus("Logged to blockchain successfully. Tx: " + (res.data?.transactionId || "simulated"));
      })
      .catch(err => {
        setBlockchainLogStatus("Blockchain log failed: " + (err.response?.data?.error || err.message));
      });
  };

  // Function to post the task
  const postTask = (note) => {
    // Generate txhash for the note creation
    const txhash = generateSimulatedTxHash();
    const walletAddr = localStorage.getItem('walletAddress') || walletAddress;
    
    console.log(`Creating note with txhash: ${txhash}, wallet: ${walletAddr}`);
    
    axios.post(`/api/note/post?walletAddress=${walletAddr}&txhash=${txhash}`, note)
      .then(response => {
        setSubmittedNote(response.data);  // Update the submittedTask state
        setBlockchainLogStatus(`Note created successfully with txhash: ${txhash}`);
        // Reset the form after submission
        setNewNote({
          title: '',
          noteText: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          user: { userId: userId },
        });
        setWalletAddress('');
        console.log({
          noteId: response.data.note.noteId,
          walletAddress: walletAddr,
          txhash: txhash,
          noteTitle: note.title
        });
      })
      
      .catch(error => {
        console.error("Error posting task:", error);
        setBlockchainLogStatus("Error creating note: " + error.message);
      });
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!walletAddress) {
      setBlockchainLogStatus("Please enter your wallet address before submitting.");
      return;
    }
    postTask(newNote);
  };

  // Handle changes to form fields
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "userId") {
      setNewNote(prevTask => ({
        ...prevTask, user: { userId: value }
      }));
    } else {
      setNewNote(prevTask => ({
        ...prevTask,
        [name]: value,
      }));
    }
  };

  return (
    <ThemeProvider theme={theme}>
      {/* Navbar */}
      <nav className="navbar">
        <h1 className="navbar-logo">TaskBuster</h1>
        <div className="navbar-links">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/register" className="nav-link">Register</Link>
          <Link to="/login" className="nav-link">Login</Link>
        </div>
      </nav>
      <div className='screen'>
        <Container maxWidth="sm" sx={{ mt: 4 }}>
          <Typography variant="h2" gutterBottom>
            Create a Task
          </Typography>

          {/* Paper component for form container */}
          <Paper elevation={3} sx={{ padding: 3 }}>
            {/* Form to create a new task */}
            <form onSubmit={handleSubmit}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Title"
                  name="title"
                  variant="outlined"
                  value={newNote.title}
                  onChange={handleChange}
                  fullWidth
                  required
                />
                <TextField
                  label="Notes"
                  name="noteText"
                  variant="outlined"
                  value={newNote.noteText}
                  onChange={handleChange}
                  fullWidth
                  required
                />
                <TextField
                  label="Wallet Address"
                  name="walletAddress"
                  variant="outlined"
                  value={walletAddress}
                  onChange={e => setWalletAddress(e.target.value)}
                  fullWidth
                  required
                  sx={{ mt: 1 }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  sx={{ mt: 2 ,bgcolor:"#fdcc01"}}
                >
                  Add Task
                </Button>
              </Box>
            </form>
          </Paper>

          {/* Recently Submitted Task */}
          {submittedNote && (
            <Box sx={{ mt: 4, backgroundColor: '#e6e3e3', padding: 2, borderRadius: 2,justifyContent:'center' }}>
              <Typography variant="h6" sx={{color:'black'}}>Recently Submitted Note</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} sx={{color:'black'}}><strong>Title:</strong> {submittedNote.title}</Grid>
                <Grid item xs={6} sx={{color:'black'}}><strong>Notes:</strong> {submittedNote.noteText}</Grid>
              </Grid>
              {blockchainLogStatus && (
                <Typography variant="body2" sx={{color:'blue', mt: 2}}>{blockchainLogStatus}</Typography>
              )}
            </Box>
          )}
        </Container>
      </div>
    </ThemeProvider>
  );
}

export default TaskCreate;
