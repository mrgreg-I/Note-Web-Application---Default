import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Typography from '@mui/material/Typography';
import { TextField, Button, Container, Box, Paper, IconButton, Alert } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import {Blockfrost, WebWallet, Blaze, Core} from '@blaze-cardano/sdk'
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Tooltip from '@mui/material/Tooltip';
import { Link } from 'react-router-dom';
import Logo from "../assets/Logo1.png"
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { Select, MenuItem, FormControl, InputLabel } from '@mui/material';

function TaskUpdate() {
  
  const navigate = useNavigate();
  const location = useLocation();
  const { noteId } = location.state || {};  // Get taskId from URL
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDialogOpenUpdate, setIsDialogOpenUpdate] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [walletAddress, setWalletAddress] = useState('');
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
const generateSimulatedTxHash = () => {
    return 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'.replace(/x/g, () => {
        return Math.floor(Math.random() * 16).toString(16);
    });
}
const handleSubmitTransaction = async () => {
  const lovelaceAmount = 1_000_000n; 

  if (walletApi) {
    try {
      const wallet = new WebWallet(walletApi);
      const blaze = await Blaze.from(provider, wallet);

      const bech32Address = Core.Address.fromBytes(
        Buffer.from(walletAddress, 'hex')
      ).toBech32();

      const tx = await blaze
        .newTransaction()
        .payLovelace(Core.Address.fromBech32(bech32Address), lovelaceAmount)
        .complete();

      const signedTx = await blaze.signTransaction(tx);
      const txId = await blaze.provider.postTransactionToChain(signedTx);

      return {
        transactionId: txId,
        amount: lovelaceAmount,
        isSimulated: false,
      };
    } catch (error) {
      console.error("Error submitting self-transaction:", error);
      throw error; 
    }
  }

  // Wallet not connected
  throw new Error("Wallet not connected");
};

   

const updateTask = async (note) => {
  try {
    let txResult;
    let txhash;
    
    // Step 1: Try to submit a real transaction (self-transaction)
    try {
      txResult = await handleSubmitTransaction();
      txhash = txResult.transactionId;
      console.log(`Real transaction successful: ${txhash}`);
    } catch (txError) {
      // If real transaction fails, use simulated txhash
      console.log(`Real transaction failed, using simulated txhash:`, txError.message);
      txResult = {
        transactionId: generateSimulatedTxHash(),
        amount: 1_000_000n,
        isSimulated: true
      };
      txhash = txResult.transactionId;
    }
    
    const walletAddr = localStorage.getItem('walletAddress');
    
    console.log(`Updating note with txhash: ${txhash} (isSimulated: ${txResult.isSimulated})`);
    
    // Step 2: Call backend with txhash parameter
    const response = await axios.put(
      `/api/note/put/${note.noteId}?walletAddress=${walletAddr}&txhash=${txhash}`, 
      note
    );

    console.log("Note updated successfully:", response.data);
    
    // Step 3: Set transaction info with the txhash
    setTransactionInfo({
      type: 'UPDATE',
      noteTitle: note.title,
      noteText: note.noteText,
      transactionId: txhash,
      network: provider.network,
      fee: txResult.isSimulated ? 'Simulated' : '1.0 ADA',
      wallet: localStorage.getItem('connectedWallet'),
      isSimulated: txResult.isSimulated
    });
    setShowTransactionDialog(true);
    
    // Update the task in currentData to trigger re-render
    setCurrentData(prevState => ({
      ...prevState,
      title: response.data.note.title,
      noteText: response.data.note.noteText,
      updatedAt: new Date().toISOString(),
      txhash: txhash,
    }));

    // Also update updateData if needed
    setUpdateData(prevData => ({
      ...prevData,
      title: response.data.note.title,
      noteText: response.data.note.noteText,
      updatedAt: new Date().toISOString(),
      txhash: txhash,
    }));
    
  } catch (error) {
    console.error("Error updating note:", error);
    setTransactionError("Error updating note: " + error.message);
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
  if (selectedNote && selectedNote.noteId) {
    try {
      let txResult;
      let txhash;
      
      // Step 1: Try to submit a real transaction (self-transaction)
      try {
        txResult = await handleSubmitTransaction();
        txhash = txResult.transactionId;
        console.log(`Real transaction successful: ${txhash}`);
      } catch (txError) {
        // If real transaction fails, use simulated txhash
        console.log(`Real transaction failed, using simulated txhash:`, txError.message);
        txResult = {
          transactionId: generateSimulatedTxHash(),
          amount: 1_000_000n,
          isSimulated: true
        };
        txhash = txResult.transactionId;
      }
      
      const walletAddr = localStorage.getItem('walletAddress');
      
      console.log(`Deleting note with txhash: ${txhash} (isSimulated: ${txResult.isSimulated})`);
      
      // Step 2: Call backend with txhash parameter
      const response = await axios.delete(
        `/api/note/delete/${selectedNote.noteId}?walletAddress=${walletAddr}&txhash=${txhash}`
      );
      
      console.log("Note deleted successfully:", response.data);
      
      // Step 3: Show transaction confirmation
      setTransactionInfo({
        type: 'DELETE',
        noteTitle: selectedNote.title,
        transactionId: txhash,
        network: provider.network,
        fee: txResult.isSimulated ? 'Simulated' : '1.0 ADA',
        wallet: localStorage.getItem('connectedWallet'),
        isSimulated: txResult.isSimulated
      });
      setShowTransactionDialog(true);
      
      setTimeout(() => {
        navigate(`/tasks`);
        setConfirm(false);
      }, 2000);
    } catch (error) {
      console.error('Error deleting task:', error);
      setTransactionError("Error deleting task: " + error.message);
      setConfirm(false);
    }
  }
};

  return (
    <div>
        {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        bgcolor="#091057"
        padding={2}
        color="white"
      >
        <Link to="/tasks">
         <Button sx={{ width: 'auto', mr: 1 }}><img src={Logo} alt="Logo" style={{ maxWidth: "60px" }} /></Button>
        </Link>
        
        <Box display="flex" gap={3}>
          <Link to="/tasks">
            <Typography
              sx={{
                color: "white",
                fontFamily: "Poppins",
                fontSize: "16px",
                cursor: "pointer",
                textDecoration: "none",
                fontWeight: "bold",
              }}
            >
              Home
            </Typography>
          </Link>
    
          <Link to="/login">
            <Typography
              sx={{
                color: "white",
                fontFamily: "Poppins",
                fontSize: "16px",
                cursor: "pointer",
                textDecoration: "none",
                fontWeight: "bold",
              }}
              onClick={handleLogout}
            >
              Logout
            </Typography>
          </Link>
        </Box>
      </Box>

      <Box padding={4}>
        <Box display="flex" alignItems="center" marginBottom={3}>
            <IconButton onClick={() => navigate(`/tasks`)}>
              <ArrowBackIcon sx={{ color: "#091057" }} />
            </IconButton>
        </Box>

        <Typography
        sx={{
          fontFamily: "Poppins",
          fontSize: "24px",
          fontWeight: "bold",
          marginBottom: 2,
          color:'#091057',
          "& .MuiInputBase-root": {
            fontSize: "24px",
            fontWeight: "bold",
            fontFamily: "Poppins",
            color: "#091057",
          },
        }}>{currentData.title}</Typography>
        <Box display="flex" justifyContent="space-between" marginBottom={3}>
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'row' }}>
        <Typography
        fontFamily="Poppins"
              fontSize="16px"
              color="#091057"
              fontWeight="bold">
        </Typography>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1 }}>
                <Tooltip title="Update">
                    <Button 
                    onClick={() => setIsDialogOpenUpdate(true)}
                    sx={{ width: '150px',height:36 }} variant="outlined" color="success" startIcon={<CheckCircleOutlineIcon />} fullWidth>
                    Update Task
                    </Button>
                </Tooltip>

                <Tooltip title="Delete Task">
                  <Button sx={{ width: '150px',height:36 }} variant="outlined" color="error" startIcon={<DeleteIcon />} fullWidth onClick={(event) => {
                    event.stopPropagation();
                    setSelectedNote(currentData); // Set selectedTask before confirming delete
                    setConfirm(true); // Show the delete confirmation dialog
                  }}>
                    Delete Task
                  </Button>
                </Tooltip>
        </Box>
        </Box>
        
        
        <Typography
          variant="h6"
          color="#091057"
          fontFamily="Poppins"
          fontWeight="bold"
          marginBottom={1}
        >
          Notes
        </Typography>
        <Box
          sx={{
            border: '1px solid #091057',  
            padding: '16px',               
            borderRadius: '8px',           
            backgroundColor: '#f9f9f9',
            height:160   
          }}
        >
          <Typography>
            {currentData.noteText}
          </Typography>
        </Box>
        
      <Dialog open={isDialogOpenUpdate} onClose={() => setIsDialogOpenUpdate(false)}>
          <form onSubmit={handleUpdateSubmit}>
        <DialogContent>
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
                    name="noteText"
                    variant="outlined"
                    value={updateData.noteText}
                    onChange={handleUpdateChange}
                    fullWidth
                    required
                  />
                </Box>
        </DialogContent>

        <DialogActions>
          <Button
          onClick={() => setIsDialogOpenUpdate(false)}
          type='submit'
            variant="contained"
            sx={{
              backgroundColor: "#EC8305",
              color: "white",
              fontFamily: "Poppins",
              textTransform: "none",
            }}
          >
            Update Note
          </Button>
        </DialogActions>
        </form>
      </Dialog>
      </Box>
          {/* Delete Confirmation Dialog */}
          <Dialog open={confirm} onClose={() => setConfirm(false)}>
            <DialogTitle>Are you sure you want to delete this task?</DialogTitle>
            <DialogContent>
              <DialogContentText>This action cannot be undone.</DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={confirmDeleteTask} color="primary">Yes</Button>
              <Button onClick={() => setConfirm(false)} color="secondary">No</Button>
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
                <Typography sx={{ fontWeight: "bold", color: "#091057" }}>Note Title:</Typography>
                <Typography>{transactionInfo.noteTitle}</Typography>
              </Box>
              <Box>
                <Typography sx={{ fontWeight: "bold", color: "#091057" }}>Note Text:</Typography>
                <Typography>{transactionInfo.noteText}</Typography>
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
      
      {/* Footer */}
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

export default TaskUpdate;
