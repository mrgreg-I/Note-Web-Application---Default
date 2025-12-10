import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { ThemeProvider } from '@emotion/react';
import { createTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import { TextField, Button, Container, Box, Paper } from '@mui/material';
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
    noteText: '',
    status: 'Pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    user: { userId: '' },
});


  const [updateData, setUpdateData] = useState({
    noteId: '',
    title: '',
    noteText: '',
    status: 'Pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    user: { userId: '' },
});


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


  const updateTask = (note) => {
    axios.put(`/api/note/put`, note, {
      params: { noteId: note.noteId },
    })
      .then(response => {
        console.log("Task updated successfully:", response.data);
      })
      .catch(error => console.error("Error updating task:", error));
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
            <Typography
              variant="h6"
              color="#091057"
              fontFamily="Poppins"
              fontWeight="bold"
              marginBottom={1}
            >
              Status: {currentData.status}
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
                    name="noteText"
                    variant="outlined"
                    value={updateData.noteText}
                    onChange={handleUpdateChange}
                    fullWidth
                    required
                  />

                  <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="status"
                    value={updateData.status}
                    label="Status"
                    onChange={handleUpdateChange}
                  >
                    <MenuItem value="Pending">Pending</MenuItem>
                    <MenuItem value="In Progress">In Progress</MenuItem>
                    <MenuItem value="Completed">Completed</MenuItem>
                  </Select>
                </FormControl>

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
      </ThemeProvider>
    </div>
  );
}

export default TaskUpdate;
