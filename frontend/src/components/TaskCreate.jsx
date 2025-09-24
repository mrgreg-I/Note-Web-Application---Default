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
  const { toDoListId } = location.state || {}; // Retrieve toDoListId from location state
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    status: 'Pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    dueDate: '',
    tag: { tagId: '' },
    toDoList: { toDoListID: toDoListId }, // Store toDoListId
  });

  const [submittedTask, setSubmittedTask] = useState(null);

  // Function to post a new tag
  const postTag = (priority) => {
    const newTag = {
      name: priority,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    axios.post('/api/taskbuster/postTag', newTag)
      .then(response => {
        // Store the tagId in the newTask state for later use
        setNewTask(prevTask => ({
          ...prevTask,
          tag: { tagId: response.data.tagId },
        }));
      })
      .catch(error => console.error("Error posting tag:", error));
  };

  // Function to post the task
  const postTask = (task) => {
    axios.post('/api/taskbuster/postTask', task)
      .then(response => {
        setSubmittedTask(response.data);  // Update the submittedTask state
        // Reset the form after submission
        setNewTask({
          title: '',
          description: '',
          status: 'Pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          dueDate: '',
          tag: { tagId: '' },
          toDoList: { toDoListID: toDoListId },
        });
      })
      .catch(error => console.error("Error posting task:", error));
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    postTask(newTask);
  };

  // Handle changes to form fields
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

          {/* Priority Selection Buttons (Aligned in a row) */}
          <Box sx={{ display: 'flex', justifyContent: 'space-around', mb: 2,gap:2 }}>
            <Button onClick={() => postTag("Low Priority")} variant="contained" sx={{bgcolor:"#fdcc01"}}>Low Priority</Button>
            <Button onClick={() => postTag("High Priority")} variant="contained" sx={{bgcolor:"#fdcc01"}}>High Priority</Button>
            <Button onClick={() => postTag("Urgent")} variant="contained" sx={{bgcolor:"#fdcc01"}}>Urgent</Button>
          </Box>

          {/* Paper component for form container */}
          <Paper elevation={3} sx={{ padding: 3 }}>
            {/* Form to create a new task */}
            <form onSubmit={handleSubmit}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Title"
                  name="title"
                  variant="outlined"
                  value={newTask.title}
                  onChange={handleChange}
                  fullWidth
                  required
                />
                <TextField
                  label="Description"
                  name="description"
                  variant="outlined"
                  value={newTask.description}
                  onChange={handleChange}
                  fullWidth
                  required
                />
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
          {submittedTask && (
            <Box sx={{ mt: 4, backgroundColor: '#e6e3e3', padding: 2, borderRadius: 2,justifyContent:'center' }}>
              <Typography variant="h6" sx={{color:'black'}}>Recently Submitted Task</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} sx={{color:'black'}}><strong>Title:</strong> {submittedTask.title}</Grid>
                <Grid item xs={6} sx={{color:'black'}}><strong>Description:</strong> {submittedTask.description}</Grid>
                <Grid item xs={6} sx={{color:'black'}}><strong>Status:</strong> {submittedTask.status}</Grid>
                <Grid item xs={6} sx={{color:'black'}}><strong>Due Date:</strong> {new Date(submittedTask.dueDate).toLocaleString()}</Grid>
                <Grid item xs={6} sx={{color:'black'}}><strong>Tag ID:</strong> {submittedTask.tag.tagId}</Grid>
              </Grid>
            </Box>
          )}
        </Container>
      </div>
    </ThemeProvider>
  );
}

export default TaskCreate;
