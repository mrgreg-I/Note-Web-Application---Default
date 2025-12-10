import * as React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import axios from 'axios';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Box, IconButton, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import Logo from "../assets/Logo1.png";
import { FormControl, Select, InputLabel, MenuItem } from "@mui/material";


function TaskView() {

  const userId = localStorage.getItem('loggedInUserId');

  const [note, setNote] = useState([]);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [newNote, setNewNote] = useState({
  title: '',
  noteText: '',
  status: 'Pending',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  user: { userId: userId },
});


  const navigate = useNavigate();

  // 🌙 DARK MODE STATE
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  useEffect(() => {
    const fetchTasks = async () => {
      if (!userId) return;

      try {
        const response = await axios.get(`http://localhost:8080/api/note/tasks?userId=${userId}`);
        setNote(sortNotes(response.data || [], sortType));

      } catch (error) {
        console.error('Error fetching note:', error);
      }
    };

    fetchTasks();
  }, [userId]);
  const [sortType, setSortType] = useState("Newest");

  const handleAddTaskClick = () => setOpenAddDialog(true);
  const handleCloseDialog = () => setOpenAddDialog(false);

  const postNote = (noteData) => {
    axios.post('/api/note/post', noteData)
      .then(response => {
        const newNoteData = response.data;
        setNote(prev => [...prev, newNoteData]);
        setNewNote({
          title: '',
          noteText: '',
          status: 'Pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          user: { userId: userId },
        });
      })
      .catch(error => console.error("Error posting task:", error));
        };
        const sortNotes = (notes, type) => {
        let sorted = [...notes];

        if (type === "Newest") {
          sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } 
        else if (type === "Oldest") {
          sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        }
        else if (type === "Alphabetical") {
          sorted.sort((a, b) => a.title.localeCompare(b.title));
        }

        return sorted;
      };


  const handleSubmit = (e) => {
    e.preventDefault();
    postNote(newNote);
  };

  return (
    <div
  style={{
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    backgroundColor: darkMode ? "#121212" : "white",
    color: darkMode ? "white" : "black",
    transition: "background-color 0.3s ease, color 0.3s ease"
  }}
>


      {/* HEADER */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        bgcolor="#091057"
        padding={2}
        color="white"
      >
        <Link to="/tasks">
          <Button sx={{ width: 'auto', mr: 1 }}>
            <img src={Logo} alt="Logo" style={{ maxWidth: "60px" }} />
          </Button>
        </Link>

        <Box display="flex" gap={3} alignItems="center">

          {/* 🌙 DARK MODE BUTTON */}
                              <Button
                      onClick={toggleDarkMode}
                      sx={{
                        backgroundColor: darkMode ? "#333" : "white",
                        color: darkMode ? "white" : "#091057",
                        padding: "6px 16px",
                        borderRadius: "10px",
                        textTransform: "none",
                        fontFamily: "Poppins",
                        fontWeight: "bold",
                        fontSize: "16px",
                        transition: "transform 0.2s ease, background-color 0.2s ease",
                        "&:hover": {
                          transform: "scale(1.05)",
                          backgroundColor: darkMode ? "#444" : "#e8e8e8",
                        }
                      }}
                    >
                      {darkMode ? "Light Mode" : "Dark Mode"}
                    </Button>


        {/* 🌙 DARK MODE BUTTON */}


{/* HOME */}
<Link to="/tasks" style={{ textDecoration: 'none' }}>
  <Button
    sx={{
      backgroundColor: darkMode ? "#333" : "white",
      color: darkMode ? "white" : "#091057",
      padding: "6px 16px",
      borderRadius: "10px",
      textTransform: "none",
      fontFamily: "Poppins",
      fontWeight: "bold",
      fontSize: "16px",
      transition: "transform 0.2s ease, background-color 0.2s ease",
      "&:hover": {
        transform: "scale(1.05)",
        backgroundColor: darkMode ? "#444" : "#e8e8e8",
      }
    }}
  >
    Home
  </Button>
</Link>


          {/* LOGOUT */}
          <Button
  onClick={() => {
    localStorage.removeItem('loggedInUserId');
    navigate('/login');
  }}
  sx={{
    backgroundColor: darkMode ? "#333" : "white",
    color: darkMode ? "white" : "#091057",
    padding: "6px 16px",
    borderRadius: "10px",
    textTransform: "none",
    fontFamily: "Poppins",
    fontWeight: "bold",
    fontSize: "16px",
    transition: "transform 0.2s ease, background-color 0.2s ease",
    "&:hover": {
      transform: "scale(1.05)",
      backgroundColor: darkMode ? "#444" : "#e8e8e8",
    }
  }}
>
  Logout
</Button>



        </Box>
      </Box>

      {/* CONTENT */}
      <Box flex="1" padding={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <IconButton onClick={() => navigate("/todos")}>
            <ArrowBackIcon sx={{ color: darkMode ? "white" : "#091057" }} />
          </IconButton>

          <Typography sx={{
            fontFamily: "Poppins",
            fontSize: "24px",
            fontWeight: "bold",
            color: darkMode ? "white" : "#091057"
          }}>
            List
          </Typography>

          <Box display="flex" alignItems="center" gap={2}>

  {/* SORT DROPDOWN */}
  <FormControl size="small" sx={{ minWidth: 140 }}>
    <Select
      value={sortType}
      onChange={(e) => {
        setSortType(e.target.value);
        setNote(sortNotes(note, e.target.value));
      }}
      sx={{
        backgroundColor: darkMode ? "#333" : "white",
        color: darkMode ? "white" : "#091057",
        fontFamily: "Poppins",
      }}
    >
      <MenuItem value="Newest">Newest</MenuItem>
      <MenuItem value="Oldest">Oldest</MenuItem>
      <MenuItem value="Alphabetical">A – Z</MenuItem>
    </Select>
  </FormControl>

  {/* ADD NOTE BUTTON */}
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
    Add Note
  </Button>
</Box>

        </Box>

        {/* TASK CARDS */}
        <Box display="flex" gap={3} flexWrap="wrap" marginTop={3}>
          {note.map((task) => (
            <Link 
              to={`/taskdetails`}
              state={{ noteId: task.noteId }}
              key={task.noteId}
              style={{ textDecoration: 'none' }}
            >
              <Box
                width="300px"
                padding={2}
                bgcolor={darkMode ? "#1E1E1E" : "#F1F0E8"}
                borderRadius="8px"
                boxShadow={2}
                sx={{ cursor: "pointer" }}
              >
                {/* Title */}
                <Typography
                  variant="h6"
                  fontFamily="Poppins"
                  fontWeight="bold"
                  color={darkMode ? "#EC8305" : "#091057"}
                >
                  {task.title}
                </Typography>

                {/* Notes */}
                <Typography
                  color={darkMode ? "#FFD37A" : "#EC8305"}
                  fontFamily="Poppins"
                  fontSize="14px"
                  marginTop={1}
                >
                  {task.noteText}
                </Typography>

                {/* ⭐ STATUS DISPLAY */}
                <Typography
                  fontFamily="Poppins"
                  fontSize="14px"
                  marginTop={1}
                  color={task.status === "Completed" ? "green" :
                        task.status === "In Progress" ? "orange" :
                        "red"}
                  fontWeight="bold"
                >
                  Status: {task.status}
                </Typography>

              </Box>
            </Link>
          ))}

        </Box>
      </Box>

      {/* ADD TASK DIALOG */}
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
              value={newNote.noteText}
              onChange={(e) => setNewNote({ ...newNote, noteText: e.target.value })}
            />
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={newNote.status}
                label="Status"
                onChange={(e) => setNewNote({ ...newNote, status: e.target.value })}
              >
                <MenuItem value="Pending">Pending</MenuItem>
                <MenuItem value="In Progress">In Progress</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
              </Select>
            </FormControl>

          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit">Add Task</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* FOOTER */}
      <Box
        bgcolor="#091057"
        padding={3}
        color="white"
        display="flex"
        flexDirection="column"
        alignItems="center"
        marginTop="auto"
      >
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
