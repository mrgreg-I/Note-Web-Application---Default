import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { ThemeProvider } from '@emotion/react';
import { createTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import { TextField, Button, Container, Box, Paper, Dialog, DialogTitle, DialogContent, DialogActions, Alert } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { Link } from 'react-router-dom';

const theme = createTheme({
  typography: {
    fontFamily: `'Poppins', sans-serif`,
    h2: {
      color: 'black',
      textAlign: 'center',  // Center the heading text
    },
    button: {
      color: 'yellow',
    },
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

function TaskUpdate() {
  const { noteId } = useParams();  // Get taskId from URL
  const [currentData, setCurrentData] = useState({
    noteId: '',
    title: '',
    notes: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    user: { userId: '' },
  });

  const [updateData, setUpdateData] = useState({
    noteId: '',
    title: '',
    notes: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    user: { userId: '' },
  });

  const [transactionInfo, setTransactionInfo] = useState(null);
  const [showTransactionDialog, setShowTransactionDialog] = useState(false);
  const [transactionError, setTransactionError] = useState('');

  useEffect(() => {
    if (noteId) {
      // Fetch task details from API
      axios.get(`/api/note/get/${noteId}`)
        .then(response => {
          const note = response.data;
          setCurrentData(note);
          setUpdateData(note);  // Pre-fill form with task data
        })
        .catch(error => console.error("Error fetching task:", error));
    }
  }, [noteId]);


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

      if (actionType === 'UPDATE') {
        endpoint = '/api/blockchain/simulate-note-update-transaction';
      } else if (actionType === 'DELETE') {
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


  const updateTask = async (note) => {
    try {
      const response = await axios.put(`/api/note/put`, note, {
        params: { noteId: note.noteId },
      });
      console.log("Task updated successfully:", response.data);
      
      // Log update to blockchain if wallet is connected
      const txInfo = await logTransactionToBlockchain(note.noteId, note.title, 'UPDATE');
      
      if (txInfo) {
        setTransactionInfo({
          type: 'UPDATE',
          noteTitle: note.title,
          transactionId: txInfo.transactionId,
          network: txInfo.network,
          fee: txInfo.fee,
          wallet: localStorage.getItem('connectedWallet')
        });
        setShowTransactionDialog(true);
      }
    } catch (error) {
      console.error("Error updating task:", error);
      setTransactionError("Error updating task: " + error.message);
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
  return (
    <div>
      <ThemeProvider theme={theme}>
        <nav className="navbar">
          <h1 className="navbar-logo">TaskBuster</h1>
          <div className="navbar-links">
            <Link to="/tasks" className="nav-link">Tasks</Link>
            <span onClick={handleLogout} className="nav-link logout-text">Logout</span>
          </div>
        </nav>
        <div className='screen'>
          <Container maxWidth="sm" sx={{ mt: 4 }}>
            <Typography variant="h2" gutterBottom>
              Update Task
            </Typography>

            {/* Paper component for form container */}
            <Paper elevation={3} sx={{ padding: 3 }}>
              <form onSubmit={handleUpdateSubmit}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    label="Title"
                    name="title"
                    variant="outlined"
                    value={updateData.title}
                    onChange={handleUpdateChange}
                    fullWidth
                    required
                  />
                  <TextField
                    label="Notes"
                    name="notes"
                    variant="outlined"
                    value={updateData.notes}
                    onChange={handleUpdateChange}
                    fullWidth
                    required
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    size="large"
                    sx={{ mt: 2, bgcolor: "#fdcc01" }}
                  >
                    Update Task
                  </Button>
                </Box>
              </form>
            </Paper>
          </Container>
        </div>

        {/* Transaction Confirmation Dialog */}
        <Dialog open={showTransactionDialog} onClose={handleCloseTransactionDialog} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ bgcolor: "#091057", color: "white" }}>
            ✅ {transactionInfo?.type} Transaction Logged
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            {transactionError && <Alert severity="error">{transactionError}</Alert>}
            {transactionInfo && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="body2" sx={{ color: '#666', fontWeight: 'bold' }}>Action Type</Typography>
                  <Typography variant="body1">{transactionInfo.type}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ color: '#666', fontWeight: 'bold' }}>Task</Typography>
                  <Typography variant="body1">{transactionInfo.taskTitle}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ color: '#666', fontWeight: 'bold' }}>Transaction ID</Typography>
                  <Typography variant="body1" sx={{ fontSize: '0.85rem', wordBreak: 'break-all' }}>{transactionInfo.transactionId}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ color: '#666', fontWeight: 'bold' }}>Network</Typography>
                  <Typography variant="body1">{transactionInfo.network}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ color: '#666', fontWeight: 'bold' }}>Fee</Typography>
                  <Typography variant="body1">{transactionInfo.fee}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ color: '#666', fontWeight: 'bold' }}>Wallet Used</Typography>
                  <Typography variant="body1" sx={{ fontSize: '0.85rem', wordBreak: 'break-all' }}>{transactionInfo.wallet}</Typography>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseTransactionDialog} variant="contained" sx={{ bgcolor: "#091057" }}>
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </ThemeProvider>
    </div>
  );
}

export default TaskUpdate;
