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
  const { taskId } = location.state || {};  // Get taskId from URL
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [selectedComment, setSelectedComment] = useState(null); // Store the comment to update
  const [updatedCommentText, setUpdatedCommentText] = useState(""); // Text for the updated comment
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDialogOpenUpdate, setIsDialogOpenUpdate] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
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

  const [newComment, setNewComment] = useState({
    commentText: '', 
    task: { taskId: taskId }, 
    createdAt: new Date().toISOString(),
  });
  const [filteredComments, setFilteredComments] = useState([]);
  const [submittedComment, setSubmittedComment] = useState(null);

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
      if (taskId && token) {
        try {
          const taskResponse = await axios.get(`/api/taskbuster/getTask/${taskId}`, authHeaders());
          setCurrentData(taskResponse.data);
          setUpdateData(taskResponse.data);

          const commentResponse = await axios.get(`/api/taskbuster/getComment`, authHeaders());
          const taskComments = commentResponse.data.filter(comment => comment.task.taskId === taskId);
          setFilteredComments(taskComments);
        } catch (error) {
          console.error('Error fetching task or comments:', error);
        }
      }
    };

    fetchData();
  }, [taskId, token]);

  const postComment = async (comment) => {
    try {
      const response = await axios.post('/api/taskbuster/postComment', comment, authHeaders());
      // Add the new comment to the existing filtered comments
      setFilteredComments(prevComments => [response.data, ...prevComments]);
      setSubmittedComment(response.data);
      setNewComment({
        commentText: '',
        task: { taskId: taskId },
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error posting comment:', error);
    }
  };

  const deleteComment = async (commentId) => {
    try {
      await axios.delete(`/api/taskbuster/deleteComment/${commentId}`, authHeaders());
      // Remove the deleted comment from filteredComments
      setFilteredComments(prevComments => prevComments.filter(comment => comment.commentId !== commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const updateTaskStatus = async (status) => {
    const taskToUpdate = { ...currentData, status: status };
    try {
      await axios.put(`/api/taskbuster/putTask`, taskToUpdate, {
        params: { taskId: taskToUpdate.taskId },
        ...authHeaders()
      });
      setCurrentData(prevState => ({ ...prevState, status }));
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    postComment(newComment);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewComment(prevComment => ({
      ...prevComment,
      [name]: value,
    }));
  };

// start of update functions
const updateTag = async (tagId, priority) => {
  const updatedTag = {
    name: priority,
    updatedAt: new Date().toISOString(),
  };

  try {
    const response = await axios.put(`/api/taskbuster/putTag?tagId=${tagId}`, updatedTag);
    // Update the tag in currentData to trigger re-render
    setUpdateData(prevData => ({
      ...prevData,
      tag: { tagId: response.data.tagId, name: response.data.name },
    }));

    setCurrentData(prevData => ({
      ...prevData,
      tag: { tagId: response.data.tagId, name: response.data.name },
    }));
  } catch (error) {
    console.error("Error updating tag:", error);
  }
};

const updateTask = async (task) => {
  try {
    const response = await axios.put(`/api/taskbuster/putTask`, task, {
      params: { taskId: task.taskId },
    });

    console.log("Task updated successfully:", response.data);

    // Update the task in currentData to trigger re-render
    setCurrentData(prevState => ({
      ...prevState,
      title: response.data.title,
      description: response.data.description,
      dueDate: response.data.dueDate,
      status: response.data.status,
      updatedAt: new Date().toISOString(),
      tag: response.data.tag, // Ensure tag is updated too
    }));

    // Also update updateData if needed
    setUpdateData(prevData => ({
      ...prevData,
      title: response.data.title,
      description: response.data.description,
      dueDate: response.data.dueDate,
      status: response.data.status,
      updatedAt: new Date().toISOString(),
      tag: response.data.tag,
    }));
    
  } catch (error) {
    console.error("Error updating task:", error);
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

const handleTagUpdate = (tagId, priority) => {
  updateTag(tagId, priority);
};
// end of update functions
// start of comment update
const handleEditComment = (comment) => {
  setSelectedComment(comment); // Set the selected comment
  setUpdatedCommentText(comment.commentText); // Pre-fill the comment text
  setIsUpdateDialogOpen(true); // Open the dialog
};
const updateComment = async () => {
  if (!selectedComment || updatedCommentText.trim() === "") return;

  const updatedComment = {
    ...selectedComment,
    commentText: updatedCommentText,
  };

  try {
    const response = await axios.put(`/api/taskbuster/putComment?commentId=${selectedComment.commentId}`, updatedComment, authHeaders());
    // Update the filteredComments state to reflect the updated comment
    setFilteredComments(prevComments => 
      prevComments.map(comment => comment.commentId === selectedComment.commentId ? response.data : comment)
    );
    setIsUpdateDialogOpen(false); // Close the dialog
    setSelectedComment(null); // Clear the selected comment
    setUpdatedCommentText(""); // Clear the updated comment text
  } catch (error) {
    console.error('Error updating comment:', error);
  }
};

// end of comment update
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('loggedInUserId');
    navigate('/login');
  };
  const confirmDeleteTask = () => {
    if (selectedTask) {
      axios.delete(`/api/taskbuster/deleteTask/${selectedTask.taskId}`, authHeaders())
        .then(() => {
          // After deleting, navigate the user to the correct page
          navigate(`/taskview/${currentData.toDoList.toDoListID}`); // Adjust as needed
          setConfirm(false); // Close the confirmation dialog
        })
        .catch(error => {
          console.error('Error deleting task:', error);
          setConfirm(false); // Close the dialog if an error occurs
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
        <Link to="/todos">
         <Button sx={{ width: 'auto', mr: 1 }}><img src={Logo} alt="Logo" style={{ maxWidth: "60px" }} /></Button>
        </Link>
        
        <Box display="flex" gap={3}>
          <Link to="/todos">
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
          <Link to="/profile">
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
              Profile
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
            <IconButton onClick={() => navigate(`/taskview/${currentData.toDoList.toDoListID}`)}>
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
          Priority: <Typography>{currentData.tag.name}</Typography>
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
                    setSelectedTask(currentData); // Set selectedTask before confirming delete
                    setConfirm(true); // Show the delete confirmation dialog
                  }}>
                    Delete Task
                  </Button>
                </Tooltip>
        </Box>
        </Box>
        
        <Box display="flex" justifyContent="space-between" marginBottom={3}>
  {/* Due Date Section */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Typography
              fontFamily="Poppins"
              fontSize="16px"
              color="#091057"
              fontWeight="bold"
              marginBottom={1}
              mt={1}
            >
              Due Date:
            </Typography>
            <Typography color='#EC8305'>
              {new Date(currentData.dueDate).toLocaleDateString()}
            </Typography>
          </Box>

          {/* Status Section */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column',ml:145 }}>
            <Typography
              fontFamily="Poppins"
              fontSize="16px"
              color="#091057"
              fontWeight="bold"
              marginBottom={1}
            >
              Status:
            </Typography>
            <FormControl variant="outlined" sx={{ width:200 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={currentData.status}
                onChange={(e) => updateTaskStatus(e.target.value)}
                label="Status"
              >
                <MenuItem value="Pending">Pending</MenuItem>
                <MenuItem value="Ongoing">Ongoing</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
        <Typography
          variant="h6"
          color="#091057"
          fontFamily="Poppins"
          fontWeight="bold"
          marginBottom={1}
        >
          Description
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
            {currentData.description}
          </Typography>
        </Box>
        <Typography
          variant="h6"
          color="#091057"
          fontFamily="Poppins"
          fontWeight="bold"
          marginTop={4}
          marginBottom={2}
        >
          Comments
        </Typography>
        <Box>
          {filteredComments.map((comment) => (
          <Box key={comment.commentId} sx={{ display: 'flex', alignItems: 'center', marginBottom: 1 }}>
            <Typography
              fontFamily="Poppins"
              fontSize="14px"
              color="#091057"
              marginBottom={1}
              sx={{ flex: 1 }} // Ensures the comment takes the available space
            >
                {comment.commentText}
              </Typography>
              <IconButton onClick={() => handleEditComment(comment)}>
                <EditIcon />
              </IconButton>
              <Button 
                color="error" 
                onClick={() => deleteComment(comment.commentId)} 
                sx={{ width: 20, height: 20, minWidth: 'auto', padding: 0 }}
              >
                <DeleteIcon sx={{ fontSize: 20 }} />
              </Button>
            </Box>
            ))}
          </Box>
          <Button
          variant="contained"
          onClick={() => setIsDialogOpen(true)}
          sx={{
            backgroundColor: "#EC8305",
            color: "white",
            fontFamily: "Poppins",
            marginTop: 2,
          }}
        >
          Add Comment
        </Button>
        <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
          <form onSubmit={handleSubmit}>
        <DialogContent>
          <TextField
            label="Add a Comment"
            name="commentText"
            value={newComment.commentText}
            onChange={handleChange}
            multiline
            rows={4}
            variant="outlined"
            fullWidth
            placeholder="Write your comment here..."
            sx={{ backgroundColor: "#F5F5F5", borderRadius: "8px" }}
          />
        </DialogContent>
        <DialogActions>
          <Button
          type='submit'
            variant="contained"
            sx={{
              backgroundColor: "#EC8305",
              color: "white",
              fontFamily: "Poppins",
              textTransform: "none",
            }}
          >
            Post Comment
          </Button>
        </DialogActions>
        </form>
      </Dialog>
      <Dialog open={isDialogOpenUpdate} onClose={() => setIsDialogOpenUpdate(false)}>
          <form onSubmit={handleUpdateSubmit}>
        <DialogContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-around', mb: 2, gap: 2 }}>
              <Button
                onClick={() => handleTagUpdate(currentData.tag.tagId, "Low Priority")}
                variant="contained"
                sx={{ bgcolor: "primary",color:'white',width:130 }}
              >
                Low Priority
              </Button>
              <Button
                onClick={() => handleTagUpdate(currentData.tag.tagId, "High Priority")}
                variant="contained"
                sx={{ bgcolor: "primary",color:'white',width:130 }}
              >
                High Priority
              </Button>
              <Button
                onClick={() => handleTagUpdate(currentData.tag.tagId, "Urgent")}
                variant="contained"
                sx={{ bgcolor: "primary",color:'white',width:130 }}
              >
                Urgent
              </Button>
            </Box>
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
            Update Task
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
          <Dialog open={isUpdateDialogOpen} onClose={() => setIsUpdateDialogOpen(false)}>
          <DialogTitle>Edit Comment</DialogTitle>
          <DialogContent>
            <TextField
              label="Edit Comment"
              value={updatedCommentText}
              onChange={(e) => setUpdatedCommentText(e.target.value)}
              fullWidth
              multiline
              rows={4}
              variant="outlined"
              placeholder="Edit your comment here..."
              sx={{mt:2,width:300}}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsUpdateDialogOpen(false)} color="secondary">
              Cancel
            </Button>
            <Button onClick={updateComment} color="primary">
              Update Comment
            </Button>
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
