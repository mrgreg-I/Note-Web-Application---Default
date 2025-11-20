import { useState } from 'react';
import axios from 'axios';
import initCardanoWasm from "@emurgo/cardano-serialization-lib-browser/cardano_serialization_lib_bg.wasm?init";
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { ThemeProvider } from '@emotion/react';
import { createTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import { TextField, Button, Container, Box, Paper } from '@mui/material';
import Grid from '@mui/material/Grid2';


// Material UI theme
const theme = createTheme({
  typography: {
    h2: {
      color: 'black',
      textAlign: 'center',
    }
  },
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#f50057' },
  },
});


function TaskCreate() {

  // Convert CIP-30 hex -> bech32
  const hexToBech32 = async (hex) => {
    const CardanoWasm = await initCardanoWasm();
    const addr = CardanoWasm.Address.from_bytes(Buffer.from(hex, "hex"));
    return addr.to_bech32();
  };

  // Extract user
  const location = useLocation();
  const { userId } = location.state || {};

  const [newNote, setNewNote] = useState({
    title: '',
    noteText: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    user: { userId }
  });

  const [submittedNote, setSubmittedNote] = useState(null);
  const [walletAddress, setWalletAddress] = useState("");
  const [walletName, setWalletName] = useState("");
  const [blockchainLogStatus, setBlockchainLogStatus] = useState(null);

  // ---------------------------------------------------------
  // 🔐 Connect to a Cardano Wallet
  // ---------------------------------------------------------
  const connectWallet = async () => {
    try {
      setBlockchainLogStatus("");

      const walletPriority = ["lace", "eternl", "flint", "nami"];

      for (const w of walletPriority) {
        if (window.cardano?.[w]) {
          const api = await window.cardano[w].enable();
          const unused = await api.getUnusedAddresses();

          if (unused?.length) {
            const hex = unused[0];
            const bech32 = await hexToBech32(hex);

            setWalletName(w);
            setWalletAddress(bech32);

            setBlockchainLogStatus(`Connected to ${w} wallet`);
            return;
          }
        }
      }

      setBlockchainLogStatus("No Cardano wallet found.");
    } catch (e) {
      setBlockchainLogStatus("Wallet connection failed: " + e.message);
    }
  };

  // ---------------------------------------------------------
  // 🧾 Log Task Creation to Blockchain Simulation API
  // ---------------------------------------------------------

  // ---------------------------------------------------------
  // 📝 Post the Note to Backend
  // ---------------------------------------------------------
  const postTask = async (note) => {
    try {
      const response = await axios.post('/api/note/post', note);

      setSubmittedNote(response.data);

      // Log to blockchain after saving note

      // Reset form
      setNewNote({
        title: '',
        noteText: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        user: { userId },
      });

    } catch (error) {
      console.error("Error posting task:", error);
    }
  };


  // ---------------------------------------------------------
  // Handle Submit
  // ---------------------------------------------------------
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!walletAddress) {
      setBlockchainLogStatus("Please connect a wallet before submitting.");
      return;
    }
    postTask(newNote);
  };

  // Form updates
  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewNote((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <ThemeProvider theme={theme}>
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

          <Paper elevation={3} sx={{ padding: 3 }}>
            <form onSubmit={handleSubmit}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

                <Button
                  variant="contained"
                  sx={{ bgcolor: "#1976d2" }}
                  onClick={connectWallet}
                >
                  {walletAddress ? `Wallet: ${walletName}` : "Connect Wallet"}
                </Button>

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

                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  sx={{ mt: 2, bgcolor: "#fdcc01" }}
                >
                  Add Task
                </Button>
              </Box>
            </form>
          </Paper>

          {submittedNote && (
            <Box sx={{
              mt: 4,
              backgroundColor: '#e6e3e3',
              padding: 2,
              borderRadius: 2,
              justifyContent: 'center'
            }}>
              <Typography variant="h6" sx={{ color: 'black' }}>
                Recently Submitted Note
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={6}><strong>Title:</strong> {submittedNote.title}</Grid>
                <Grid item xs={6}><strong>Notes:</strong> {submittedNote.noteText}</Grid>
              </Grid>

              {blockchainLogStatus && (
                <Typography variant="body2" sx={{ color: 'blue', mt: 2 }}>
                  {blockchainLogStatus}
                </Typography>
              )}
            </Box>
          )}
        </Container>
      </div>
    </ThemeProvider>
  );
}

export default TaskCreate;
