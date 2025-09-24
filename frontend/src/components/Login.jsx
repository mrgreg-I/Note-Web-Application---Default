// src/components/Login.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { TextField, Box, Typography, Button } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputLabel from '@mui/material/InputLabel';
import InputAdornment from '@mui/material/InputAdornment';
import FormControl from '@mui/material/FormControl';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Logo from "../assets/Logo1.png";

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const navigate = useNavigate();

  const handleClickShowPassword = () => setShowPassword((prev) => !prev);

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);

    // Password validation regex
    const passwordRegex = /^(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    if (!passwordRegex.test(value)) {
      setPasswordError(
        'Password must be at least 8 characters and contain at least one special character.'
      );
    } else {
      setPasswordError('');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (passwordError) {
      alert('Please enter a valid password.');
      return;
    }

    try {
      const response = await axios.post(
        `http://localhost:8080/api/user/login?username=${username}&password=${password}`
      );
      const { userId, token } = response.data;

      // Save token and userId to localStorage
      localStorage.setItem('authToken', token);
      localStorage.setItem('loggedInUserId', userId);

      alert('Logged In Successfully!');
      onLogin(userId); // Pass userId to App
      navigate('/tasks'); // Redirect to profile after login
    } catch (error) {
      console.error('Failed to log in:', error);
      alert('Invalid username or password. Please try again.');
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
        <img src={Logo} alt="Logo" style={{ maxWidth: "60px" }} />
        <Box display="flex" gap={3}>
          <Link to="/">
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
          <Link to="/">
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
              Register
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
            >
              Login
            </Typography>
          </Link>
        </Box>
      </Box>

      <Box display="flex" minHeight="100vh" width="100%">
        {/* Left Side */}
        <Box
          flex={1}
          bgcolor="#091057"
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
        >
          <img
            src={Logo}
            alt="TaskBuster Logo"
            style={{ maxWidth: "500px", marginBottom: "20px" }}
          />
        </Box>

        {/* Login Form */}
        <Box
          flex={1}
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          bgcolor="#F1F0E8"
          padding={5}
        >
          <Box
            width="100%"
            maxWidth="400px"
            bgcolor="white"
            padding={4}
            borderRadius="8px"
            boxShadow={3}
          >
            <Typography
              variant="h5"
              fontFamily="Poppins"
              fontWeight="bold"
              textAlign="center"
              marginBottom={3}
              color="#091057"
            >
              Welcome to{" "}
              <Typography
                component="span"
                color="#EC8305"
                variant="h3"
                fontWeight="bold"
              >
                <br />
                TaskBuster
              </Typography>
            </Typography>
            <form onSubmit={handleLogin}>
              <Box>
                <FormControl
                  sx={{ m: 1, width: "25ch" }}
                  variant="outlined"
                  required
                >
                  <InputLabel htmlFor="username">Username</InputLabel>
                  <OutlinedInput
                    id="username"
                    type="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    sx={{ bgcolor: "#F5F5F5", width: 300 }}
                  />
                </FormControl>

                <FormControl
                  sx={{ m: 1, width: "25ch" }}
                  variant="outlined"
                  required
                >
                  <InputLabel htmlFor="outlined-adornment-password">
                    Password
                  </InputLabel>
                  <OutlinedInput
                    id="outlined-adornment-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={handlePasswordChange}
                    sx={{ bgcolor: "#F5F5F5", width: 300 }}
                    endAdornment={
                      <InputAdornment position="end">
                        <IconButton
                          onClick={handleClickShowPassword}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    }
                  />
                </FormControl>
              </Box>
              {passwordError && (
                <Typography color="red" textAlign="center" marginTop={1}>
                  {passwordError}
                </Typography>
              )}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{
                  backgroundColor: "#EC8305",
                  color: "white",
                  marginTop: 3,
                  fontWeight: "bold",
                  fontFamily: "Poppins",
                }}
              >
                Login
              </Button>
            </form>
          </Box>
        </Box>
      </Box>
    </div>
  );
};

export default Login;
