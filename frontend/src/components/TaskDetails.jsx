import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Typography from '@mui/material/Typography';
import { TextField, Button, Container, Box, Paper, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from '@mui/icons-material/Edit';
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

// start of update functions


const updateTask = async (note) => {
  try {
    const response = await axios.put(`/api/note/put/${note.noteId}`, note);

    console.log("Note updated successfully:", response.data);

    // Update the task in currentData to trigger re-render
    setCurrentData(prevState => ({
      ...prevState,
      title: response.data.title,
      noteText: response.data.noteText,
      updatedAt: new Date().toISOString(),
    }));

    // Also update updateData if needed
    setUpdateData(prevData => ({
      ...prevData,
      title: response.data.title,
      noteText: response.data.noteText,
      updatedAt: new Date().toISOString(),
    }));
    
  } catch (error) {
    console.error("Error updating note:", error);
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

 const confirmDeleteTask = () => {
  if (selectedNote && selectedNote.noteId) {
    axios.delete(`/api/note/delete/${selectedNote.noteId}`)
      .then(() => {
        navigate(`/tasks`);
        setConfirm(false);
      })
      .catch(error => {
        console.error('Error deleting task:', error);
        setConfirm(false);
      });
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
          Status: {currentData.status}
        </Typography>

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

    {/* ⚠️ ADD STATUS DROPDOWN HERE */}
    <FormControl fullWidth>
      <InputLabel>Status</InputLabel>
      <Select
        name="status"
        value={updateData.status || "Pending"}
        label="Status"
        onChange={handleUpdateChange}
      >
        <MenuItem value="Pending">Pending</MenuItem>
        <MenuItem value="In Progress">In Progress</MenuItem>
        <MenuItem value="Completed">Completed</MenuItem>
      </Select>
    </FormControl>

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
          
          <Box
        bgcolor="#091057"
        padding={3}
        color="white"
        display="flex"
        flexDirection="column"
        alignItems="center"
        marginTop="auto" // Pushes the footer to the bottom
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
