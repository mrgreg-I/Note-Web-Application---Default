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
  const { taskId } = useParams();  // Get taskId from URL
  const [currentData, setCurrentData] = useState({
    taskId: '',
    title: '',
    description: '',
    status: 'Pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    dueDate: '',
    tag: { tagId: '', name: '' },
    toDoList: { toDoListID: '' },
  });

  const [updateData, setUpdateData] = useState({
    taskId: '',
    title: '',
    description: '',
    status: 'Pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    dueDate: '',
    tag: { tagId: '', name: '' },
    toDoList: { toDoListID: '' },
  });

  useEffect(() => {
    if (taskId) {
      // Fetch task details from API
      axios.get(`/api/taskbuster/getTask/${taskId}`)
        .then(response => {
          const task = response.data;
          setCurrentData(task);
          setUpdateData(task);  // Pre-fill form with task data
        })
        .catch(error => console.error("Error fetching task:", error));
    }
  }, [taskId]);

  const updateTag = (tagId, priority) => {
    const updatedTag = {
      name: priority,
      updatedAt: new Date().toISOString(),
    };

    axios.put(`/api/taskbuster/putTag?tagId=${tagId}`, updatedTag)
      .then(response => {
        setUpdateData(prevData => ({
          ...prevData,
          tag: { tagId: response.data.tagId, name: response.data.name },
        }));
      })
      .catch(error => console.error("Error updating tag:", error));
  };

  const updateTask = (task) => {
    axios.put(`/api/taskbuster/putTask`, task, {
      params: { taskId: task.taskId },
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

  const handleTagUpdate = (tagId, priority) => {
    updateTag(tagId, priority);
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
          <Link to="/todos" className="nav-link">Todos</Link>
            <Link to="/profile" className="nav-link">Profile</Link>
            <span onClick={handleLogout} className="nav-link logout-text">Logout</span>
          </div>
        </nav>
        <div className='screen'>
          <Container maxWidth="sm" sx={{ mt: 4 }}>
            <Typography variant="h2" gutterBottom>
              Update Task
            </Typography>

            {/* Priority Selection Buttons (Aligned in a row) */}
            <Box sx={{ display: 'flex', justifyContent: 'space-around', mb: 2, gap: 2 }}>
              <Button
                onClick={() => handleTagUpdate(currentData.tag.tagId, "Low Priority")}
                variant="contained"
                sx={{ bgcolor: "#fdcc01" }}
              >
                Low Priority
              </Button>
              <Button
                onClick={() => handleTagUpdate(currentData.tag.tagId, "High Priority")}
                variant="contained"
                sx={{ bgcolor: "#fdcc01" }}
              >
                High Priority
              </Button>
              <Button
                onClick={() => handleTagUpdate(currentData.tag.tagId, "Urgent")}
                variant="contained"
                sx={{ bgcolor: "#fdcc01" }}
              >
                Urgent
              </Button>
            </Box>

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
                    label="Description"
                    name="description"
                    variant="outlined"
                    value={updateData.description}
                    onChange={handleUpdateChange}
                    fullWidth
                    required
                  />
                  <TextField
                    label="Due Date"
                    name="dueDate"
                    type="datetime-local"
                    variant="outlined"
                    value={updateData.dueDate}
                    onChange={handleUpdateChange}
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
