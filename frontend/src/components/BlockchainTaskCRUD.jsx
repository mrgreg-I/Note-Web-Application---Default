import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import axios from 'axios';

const BlockchainTaskCRUD = ({ userId, walletInfo }) => {
  const [tasks, setTasks] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [transactionInfo, setTransactionInfo] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    noteText: '',
  });

  const CARDANO_NETWORK = 'preprod';

  useEffect(() => {
    if (userId) {
      // Tasks would be loaded here in a real implementation
      // For now, we'll just initialize empty state
    }
  }, [userId]);

  /**
   * Handle create/update task with blockchain simulation
   */
  const handleSaveTask = async () => {
    if (!formData.title.trim()) {
      setError('Please enter a task title');
      return;
    }

    if (!walletInfo || !walletInfo.address) {
      setError('Please connect a wallet first');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Create or update task
      let taskId = editingId || Date.now();

      // Simulate blockchain transaction
      let blockchainResponse;
      if (editingId) {
        // Update transaction
        blockchainResponse = await axios.post(
          'http://localhost:8080/api/blockchain/simulate-note-update-transaction',
          null,
          {
            params: {
              noteId: editingId,
              walletAddress: walletInfo.address,
              noteTitle: formData.title,
            },
          }
        );
      } else {
        // Create transaction
        blockchainResponse = await axios.post(
          'http://localhost:8080/api/blockchain/simulate-note-transaction',
          null,
          {
            params: {
              noteId: taskId,
              walletAddress: walletInfo.address,
              noteTitle: formData.title,
            },
          }
        );
      }

      setTransactionInfo(blockchainResponse.data);

      // Update local state
      if (editingId) {
        setTasks(tasks.map((t) => (t.id === editingId ? { ...t, ...formData } : t)));
        setSuccess(`Task updated successfully!\nTransaction: ${blockchainResponse.data.transactionId}`);
      } else {
        setTasks([
          ...tasks,
          {
            id: taskId,
            ...formData,
            createdAt: new Date(),
            blockchainTxId: blockchainResponse.data.transactionId,
          },
        ]);
        setSuccess(`Task created successfully!\nTransaction: ${blockchainResponse.data.transactionId}`);
      }

      // Reset form
      setFormData({ title: '', noteText: '' });
      setEditingId(null);
      setOpenDialog(false);

      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle delete task with blockchain simulation
   */
  const handleDeleteTask = async (taskId) => {
    if (!walletInfo || !walletInfo.address) {
      setError('Please connect a wallet first');
      return;
    }

    if (window.confirm('Are you sure you want to delete this task?')) {
      setLoading(true);
      setError('');

      try {
        // Simulate deletion blockchain transaction
        const blockchainResponse = await axios.post(
          'http://localhost:8080/api/blockchain/simulate-note-deletion-transaction',
          null,
          {
            params: {
              noteId: taskId,
              walletAddress: walletInfo.address,
            },
          }
        );

        setTransactionInfo(blockchainResponse.data);

        // Remove from local state
        setTasks(tasks.filter((t) => t.id !== taskId));
        setSuccess(`Task deleted successfully!\nTransaction: ${blockchainResponse.data.transactionId}`);

        setTimeout(() => setSuccess(''), 5000);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to delete task');
      } finally {
        setLoading(false);
      }
    }
  };

  /**
   * Handle edit task
   */
  const handleEditTask = (task) => {
    setFormData({ title: task.title, noteText: task.noteText });
    setEditingId(task.id);
    setOpenDialog(true);
  };

  /**
   * Open create new task dialog
   */
  const handleOpenCreateDialog = () => {
    setFormData({ title: '', noteText: '' });
    setEditingId(null);
    setOpenDialog(true);
  };

  /**
   * Close dialog
   */
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({ title: '', noteText: '' });
    setEditingId(null);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              📝 Blockchain-Enabled Tasks
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenCreateDialog}
              disabled={!walletInfo}
              sx={{
                backgroundColor: '#091057',
                '&:hover': { backgroundColor: '#0d1b73' },
              }}
            >
              Create Task
            </Button>
          </Box>

          {/* Wallet Status */}
          {walletInfo ? (
            <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mb: 2 }}>
              <Typography variant="caption">
                Connected to {walletInfo.walletName} • {walletInfo.address.substring(0, 20)}...
              </Typography>
            </Alert>
          ) : (
            <Alert severity="warning" icon={<BlockIcon />} sx={{ mb: 2 }}>
              Please connect a wallet to create or manage tasks with blockchain integration
            </Alert>
          )}

          {/* Error and Success Messages */}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
              {transactionInfo && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" display="block">
                    <strong>Transaction ID:</strong> {transactionInfo.transactionId}
                  </Typography>
                  <Typography variant="caption" display="block">
                    <strong>Network:</strong> {transactionInfo.network}
                  </Typography>
                  <Typography variant="caption" display="block">
                    <strong>Fee:</strong> {transactionInfo.fee} ADA
                  </Typography>
                </Box>
              )}
            </Alert>
          )}

          {/* Tasks Table */}
          {tasks.length > 0 ? (
            <TableContainer component={Paper} sx={{ mb: 2 }}>
              <Table>
                <TableHead sx={{ backgroundColor: '#091057' }}>
                  <TableRow>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Title</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Description</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Blockchain TX</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tasks.map((task) => (
                    <TableRow key={task.id} sx={{ '&:hover': { backgroundColor: '#f5f5f5' } }}>
                      <TableCell sx={{ fontWeight: 'bold' }}>{task.title}</TableCell>
                      <TableCell>{task.noteText || 'No description'}</TableCell>
                      <TableCell>
                        <Chip
                          label={task.blockchainTxId ? task.blockchainTxId.substring(0, 15) + '...' : 'N/A'}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          startIcon={<EditIcon />}
                          onClick={() => handleEditTask(task)}
                          sx={{ mr: 1 }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="small"
                          startIcon={<DeleteIcon />}
                          color="error"
                          onClick={() => handleDeleteTask(task.id)}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity="info" sx={{ mb: 2 }}>
              No tasks yet. Create one by clicking the "Create Task" button above.
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Task Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', backgroundColor: '#091057', color: 'white' }}>
          {editingId ? '✏️ Edit Task' : '➕ Create New Task'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            autoFocus
            fullWidth
            label="Task Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            margin="dense"
            variant="outlined"
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Description"
            value={formData.noteText}
            onChange={(e) => setFormData({ ...formData, noteText: e.target.value })}
            multiline
            rows={4}
            variant="outlined"
          />

          {/* Blockchain Info */}
          <Box sx={{ mt: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 1 }}>
              Blockchain Information:
            </Typography>
            <Typography variant="caption" display="block">
              <strong>Network:</strong> {CARDANO_NETWORK}
            </Typography>
            <Typography variant="caption" display="block">
              <strong>Wallet:</strong> {walletInfo?.walletName || 'Not connected'}
            </Typography>
            <Typography variant="caption" display="block">
              <strong>Transaction Fee:</strong> ~0.44 ADA
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDialog} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleSaveTask}
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
            disabled={loading || !walletInfo}
            sx={{
              backgroundColor: '#091057',
              '&:hover': { backgroundColor: '#0d1b73' },
            }}
          >
            {editingId ? 'Update Task' : 'Create Task'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BlockchainTaskCRUD;
