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
  const { toDoListID } = useParams();
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [filterStatus, setFilterStatus] = useState('All');
  const [sortOrder, setSortOrder] = useState('asc'); // Added state for sorting order
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    status: 'Pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    dueDate: '',  // Newly added dueDate
    tag: { tagId: '' },
    toDoList: { toDoListID: toDoListID },
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
        const response = await axios.get(`http://localhost:8080/api/taskbuster/getTasks?toDoListID=${toDoListID}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTasks(response.data || []);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      }
    };

    fetchTasks();
  }, [token, toDoListID]);

  useEffect(() => {
    let tasksToDisplay = tasks;

    // Filter by status
    if (filterStatus !== 'All') {
      tasksToDisplay = tasksToDisplay.filter((task) => task.status === filterStatus);
    }

    // Sort by due date
    tasksToDisplay = tasksToDisplay.sort((a, b) => {
      if (a.dueDate && b.dueDate) {
        const dateA = new Date(a.dueDate);
        const dateB = new Date(b.dueDate);
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      }
      return 0;
    });

    setFilteredTasks(tasksToDisplay);
  }, [tasks, filterStatus, sortOrder]);

  const handleAddTaskClick = () => {
    setOpenAddDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenAddDialog(false);
  };

  const postTag = (priority) => {
    const newTag = {
      name: priority,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    axios.post('/api/taskbuster/postTag', newTag)
      .then(response => {
        setNewTask(prevTask => ({
          ...prevTask,
          tag: { tagId: response.data.tagId },
        }));
      })
      .catch(error => console.error("Error posting tag:", error));
  };

  const postTask = (task) => {
    axios.post('/api/taskbuster/postTask', task)
      .then(response => {
        const newTask = response.data;
        setTasks(prevTasks => [...prevTasks, newTask]);
        setNewTask({
          title: '',
          description: '',
          status: 'Pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          dueDate: '',
          tag: { tagId: '' },
          toDoList: { toDoListID: toDoListID },
        });
      })
      .catch(error => console.error("Error posting task:", error));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    postTask(newTask);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "todoListId") {
      setNewTask(prevTask => ({
        ...prevTask,
        toDoList: { ...prevTask.toDoList, toDoListID: value },
      }));
    } else {
      setNewTask(prevTask => ({
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
          <Link to="/profile" style={{textDecoration:'none'}}>
            <Typography sx={{ color: "white", fontFamily: "Poppins", fontSize: "16px", cursor: "pointer", textDecoration: "none", fontWeight: "bold" }}>
              Profile
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
            {/* Status Filter */}
            <MenuItem onClick={() => { setFilterStatus('All'); handleMenuClose(); }}>All</MenuItem>
            <MenuItem onClick={() => { setFilterStatus('Pending'); handleMenuClose(); }}>Pending</MenuItem>
            <MenuItem onClick={() => { setFilterStatus('Ongoing'); handleMenuClose(); }}>Ongoing</MenuItem>
            <MenuItem onClick={() => { setFilterStatus('Completed'); handleMenuClose(); }}>Completed</MenuItem>

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
                    {task.title}
                  </Typography>
                </Box>
                <Typography color="#EC8305" fontFamily="Poppins" fontSize="14px" marginTop={1}>
                  {task.description}
                </Typography>
                <Typography color="#EC8305" fontFamily="Poppins" fontSize="14px" marginTop={1}>
                  {task.status}
                </Typography>
                <Typography fontFamily="Poppins" fontSize="14px" marginTop={1} color="#091057">
                  Due: {task.dueDate ? new Date(task.dueDate).toLocaleString() : "N/A"}
                </Typography>
              </Box>
            </Link>
          ))}
        </Box>
      </Box>

      {/* Add Task Dialog */}
      <Dialog open={openAddDialog} onClose={handleCloseDialog}>
        <form onSubmit={handleSubmit}>
          <DialogTitle>Add New Task</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-around', mb: 2, gap: 2 }}>
              <Button onClick={() => postTag("Low Priority")} variant="contained" sx={{ bgcolor: "primary", color: "white" }}>Low Priority</Button>
              <Button onClick={() => postTag("High Priority")} variant="contained" sx={{ bgcolor: "primary", color: "white" }}>High Priority</Button>
              <Button onClick={() => postTag("Urgent")} variant="contained" sx={{ bgcolor: "primary", color: "white" }}>Urgent</Button>
            </Box>
            <TextField
              autoFocus
              margin="dense"
              label="Task Title"
              fullWidth
              variant="outlined"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            />
            <TextField
              margin="dense"
              label="Task Description"
              fullWidth
              variant="outlined"
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
            />
            <FormControl fullWidth margin="dense">
              <InputLabel>Status</InputLabel>
              <Select
                value={newTask.status}
                onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}
                label="Status"
              >
                <MenuItem value="Pending">Pending</MenuItem>
                <MenuItem value="Ongoing">Ongoing</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Due Date"
              name="dueDate"
              type="datetime-local"
              variant="outlined"
              value={newTask.dueDate}
              onChange={handleChange}
              fullWidth
              required
              InputLabelProps={{
                shrink: true,
              }}
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
