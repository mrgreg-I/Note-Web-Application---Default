import * as React from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import axios from 'axios';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Box, IconButton, Menu, MenuItem, Select, InputLabel, FormControl, TextField, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import Logo from "../assets/Logo1.png";

function TaskView() {
  
  const userId = localStorage.getItem('loggedInUserId'); //
  console.log('userId from localStorage:', userId);

  const [note, setNote] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [filterStatus, setFilterStatus] = useState('All');
  const [sortOrder, setSortOrder] = useState('asc'); // Added state for sorting order
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [newNote, setNewNote] = useState({
    title: '',
    notes: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    user: { userId: userId },
  });
  const navigate = useNavigate();
  const token = localStorage.getItem('authToken');

  useEffect(() => {
    const fetchTasks = async () => {
      if (!token) {
        console.error('Token is missing');
        return;
      }

      try {
        const response = await axios.get(`http://localhost:8080/api/note/tasks?userId=${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setNote(response.data || []);
      } catch (error) {
        console.error('Error fetching note:', error);
      }
    };

    fetchTasks();
  }, [token, userId]);

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
        setTasks(prevTasks => [...prevTasks, newNote]);
        setNewNote({
          title: '',
          notes: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          user: { userId: value }
        });
      })
      .catch(error => console.error("Error posting task:", error));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    postTask(newNote);
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
        <Link to="/todos">
          <Button sx={{ width: 'auto', mr: 1 }}><img src={Logo} alt="Logo" style={{ maxWidth: "60px" }} /></Button>
        </Link>
        <Box display="flex" gap={3}>
          <Link to="/todos" style={{textDecoration:'none'}}>
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
      <Box display="flex" justifyContent="space-between" alignItems="center">
  <IconButton onClick={() => navigate("/todos")}>
    <ArrowBackIcon sx={{ color: "#091057" }} />
  </IconButton>
  <Typography sx={{ fontFamily: "Poppins", fontSize: "24px", fontWeight: "bold", color: "primary" }}>
    List
  </Typography>
  <Box sx={{ marginLeft: "auto" }}>
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
      Add Task
    </Button>
  </Box>
</Box>


        {/* Filter and Sort Menu */}
        <Box sx={{ mb: 2 }}>
          <Button onClick={handleMenuClick} variant="contained"
          sx={{color:'white',bgcolor:'primary'}}>
            Filter & Sort
          </Button>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            {/* Sorting by Due Date */}
            <MenuItem onClick={() => handleSortOrderChange('asc')}>Sort by Due Date (Ascending)</MenuItem>
            <MenuItem onClick={() => handleSortOrderChange('desc')}>Sort by Due Date (Descending)</MenuItem>
          </Menu>
        </Box>
              
        {/* Task Cards */}
        <Box display="flex" gap={3} flexWrap="wrap" >
          {filteredTasks.map((task) => (
            <Link to={`/taskdetails`} state={{ taskId: task.taskId }} onClick={(event) => event.stopPropagation()} style={{textDecoration:'none'}}>
              <Box width="300px" padding={2} bgcolor="#F1F0E8" borderRadius="8px" boxShadow={2} sx={{ cursor: "pointer" }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6" fontFamily="Poppins" fontWeight="bold" color="#091057">
                    {note.title}
                  </Typography>
                </Box>
                <Typography color="#EC8305" fontFamily="Poppins" fontSize="14px" marginTop={1}>
                  {note.notes}
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
              value={newNote.notes}
              onChange={(e) => setNewNote({ ...newNote, notes: e.target.value })}
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
