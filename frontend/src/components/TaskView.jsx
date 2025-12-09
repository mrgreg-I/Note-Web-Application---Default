import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import SyncIcon from '@mui/icons-material/Sync';
import { Box, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Grid, IconButton, Stack, TextField, Tooltip } from '@mui/material';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../assets/Logo1.png';
import { pollTx, sendTransaction } from '../blockchain';
import { loadNotes, saveNotes, upsertNote } from '../store';

const colors = {
  primary: '#091057',
  accent: '#EC8305',
  surface: '#F1F0E8',
  card: '#0B1547',
};

const StatusChip = ({ status }) => {
  const map = {
    confirmed: { color: 'success', icon: <CheckCircleIcon fontSize="small" /> },
    pending: { color: 'warning', icon: <PendingActionsIcon fontSize="small" /> },
    'pending-delete': { color: 'warning', icon: <PendingActionsIcon fontSize="small" /> },
  };
  const config = map[status] || { color: 'default', icon: <SyncIcon fontSize="small" /> };
  const label = status.replace('-', ' ').toUpperCase();
  return <Chip size="small" color={config.color} icon={config.icon} label={label} />;
};

function TaskView() {
  const navigate = useNavigate();
  const [notes, setNotes] = useState(() => loadNotes());
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ title: '', noteText: '' });
  const [blockfrostId, setBlockfrostId] = useState(localStorage.getItem('bfProjectId') || '');
  const [targetAddress, setTargetAddress] = useState(localStorage.getItem('bfTargetAddr') || '');
  const [lovelaceAmount, setLovelaceAmount] = useState('0');
  const [walletApi, setWalletApi] = useState(null);
  const [network] = useState('preview');

  // connect wallet (Nami/Lace/Flint)
  const connectWallet = async () => {
    if (!window?.cardano) {
      alert('No Cardano wallet found. Please install Nami/Lace/Flint.');
      return;
    }
    const wallet = window.cardano.nami || window.cardano.lace || window.cardano.eternl || window.cardano.flint;
    if (!wallet) {
      alert('No supported wallet detected.');
      return;
    }
    const api = await wallet.enable();
    setWalletApi(api);
  };

  const persistNotes = (updated) => {
    setNotes(updated);
    saveNotes(updated);
  };

  const handleOpen = (note) => {
    if (note) {
      setEditingId(note.noteId);
      setForm({ title: note.title, noteText: note.noteText });
    } else {
      setEditingId(null);
      setForm({ title: '', noteText: '' });
    }
    setOpenDialog(true);
  };

  const handleClose = () => setOpenDialog(false);

  const ensureWalletAndConfig = () => {
    if (!blockfrostId || !targetAddress) {
      alert('Please set Blockfrost Project ID and target address.');
      return false;
    }
    if (!walletApi) {
      alert('Connect your Cardano wallet first.');
      return false;
    }
    localStorage.setItem('bfProjectId', blockfrostId);
    localStorage.setItem('bfTargetAddr', targetAddress);
    return true;
  };

  const executeTx = async (note, action) => {
    const txHash = await sendTransaction({
      blockfrostProjectId: blockfrostId,
      network,
      walletApi,
      targetAddress,
      lovelaceAmount: BigInt(lovelaceAmount || 0),
      noteContent: `${note.title}: ${note.noteText}`,
      action,
      noteId: note.noteId,
    });
    return txHash;
  };

  const upsertAndSync = async (action, existingNote) => {
    if (!ensureWalletAndConfig()) return;
    const base = existingNote || {};
    const newNote = {
      ...base,
      noteId: base.noteId || crypto.randomUUID(),
      title: form.title,
      noteText: form.noteText,
      createdAt: base.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'pending',
    };
    const pendingList = upsertNote(newNote);
    setNotes(pendingList);
    try {
      const txHash = await executeTx(newNote, action);
      const withHash = { ...newNote, txHash };
      persistNotes(upsertNote(withHash));
    } catch (err) {
      alert(`Failed to submit transaction: ${err.message}`);
    }
    handleClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    upsertAndSync(editingId ? 'update' : 'create', notes.find((n) => n.noteId === editingId));
  };

  const handleDelete = async (note) => {
    if (!ensureWalletAndConfig()) return;
    const pending = { ...note, status: 'pending-delete', updatedAt: new Date().toISOString() };
    persistNotes(upsertNote(pending));
    try {
      const txHash = await executeTx(pending, 'delete');
      const withHash = { ...pending, txHash };
      persistNotes(upsertNote(withHash));
    } catch (err) {
      alert(`Failed to submit delete transaction: ${err.message}`);
    }
  };

  // background worker to sync pending tx with Blockfrost
  useEffect(() => {
    const interval = setInterval(async () => {
      const pending = notes.filter((n) => n.status !== 'confirmed' && n.txHash);
      if (!pending.length || !blockfrostId) return;
      const updates = await Promise.all(
        pending.map(async (n) => {
          try {
            const res = await pollTx({ blockfrostProjectId: blockfrostId, network, txHash: n.txHash });
            if (res) {
              if (n.status === 'pending-delete') {
                return null; // remove from cache when confirmed delete
              }
              return { ...n, status: 'confirmed' };
            }
          } catch (err) {
            console.warn('poll error', err);
          }
          return n;
        })
      );
      const filtered = updates.filter(Boolean);
      persistNotes(filtered);
    }, 20000);
    return () => clearInterval(interval);
  }, [notes, blockfrostId, network]);

  const sortedNotes = useMemo(
    () => [...notes].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)),
    [notes]
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: colors.surface }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" bgcolor={colors.primary} padding={2} color="white" boxShadow={2}>
        <Link to="/tasks" style={{ textDecoration: 'none' }}>
          <Button sx={{ width: 'auto', mr: 1 }}><img src={Logo} alt="Logo" style={{ maxWidth: '60px' }} /></Button>
        </Link>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            size="small"
            variant="outlined"
            label="Blockfrost Project ID"
            value={blockfrostId}
            onChange={(e) => setBlockfrostId(e.target.value)}
            sx={{ bgcolor: 'white', borderRadius: 1, minWidth: 260 }}
          />
          <TextField
            size="small"
            variant="outlined"
            label="Target Address"
            value={targetAddress}
            onChange={(e) => setTargetAddress(e.target.value)}
            sx={{ bgcolor: 'white', borderRadius: 1, minWidth: 260 }}
          />
          <TextField
            size="small"
            variant="outlined"
            label="Lovelace"
            value={lovelaceAmount}
            onChange={(e) => setLovelaceAmount(e.target.value)}
            sx={{ bgcolor: 'white', borderRadius: 1, width: 120 }}
          />
          <Button variant="contained" onClick={connectWallet} sx={{ backgroundColor: colors.accent, color: 'white', textTransform: 'none', fontWeight: 'bold' }}>
            {walletApi ? 'Wallet Connected' : 'Connect Wallet'}
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpen()}
            sx={{ backgroundColor: colors.accent, color: 'white', textTransform: 'none', fontWeight: 'bold' }}
          >
            Add Note
          </Button>
        </Stack>
      </Box>

      <Box flex="1" padding={4}>
        <Typography variant="h5" fontWeight="bold" color={colors.primary} sx={{ mb: 2 }}>
          On-chain Notes (cached locally for speed)
        </Typography>

        <Grid container spacing={3}>
          {sortedNotes.map((task) => (
            <Grid item xs={12} sm={6} md={4} key={task.noteId}>
              <Box
                sx={{
                  background: 'linear-gradient(180deg, #0f1d65 0%, #0b1547 100%)',
                  borderRadius: 3,
                  padding: 2,
                  color: 'white',
                  minHeight: 180,
                  boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                }}
              >
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6" fontWeight="bold">
                    {task.title}
                  </Typography>
                  <StatusChip status={task.status || 'pending'} />
                </Box>
                <Typography sx={{ color: colors.accent, fontWeight: 500 }}>{task.noteText}</Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  Updated: {new Date(task.updatedAt).toLocaleString()}
                </Typography>
                {task.txHash && (
                  <Typography variant="caption" sx={{ opacity: 0.8, wordBreak: 'break-all' }}>
                    tx: {task.txHash}
                  </Typography>
                )}
                <Stack direction="row" spacing={1} sx={{ mt: 'auto' }}>
                  <Tooltip title="Edit">
                    <IconButton size="small" onClick={() => handleOpen(task)} sx={{ color: 'white' }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton size="small" onClick={() => handleDelete(task)} sx={{ color: '#ff6b6b' }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Dialog open={openDialog} onClose={handleClose}>
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ fontWeight: 'bold', color: colors.primary }}>
            {editingId ? 'Update Note' : 'Create Note'}
          </DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 400 }}>
            <TextField
              label="Title"
              fullWidth
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              required
            />
            <TextField
              label="Note"
              multiline
              minRows={4}
              fullWidth
              value={form.noteText}
              onChange={(e) => setForm((f) => ({ ...f, noteText: e.target.value }))}
              required
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ backgroundColor: colors.accent, color: 'white' }}>
              {editingId ? 'Save & Submit' : 'Create & Submit'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  );
}

export default TaskView;
