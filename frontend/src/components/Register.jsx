// src/components/Register.jsx
import React, { useState } from 'react';
import { createUser } from '../api';
import { useNavigate, Link } from 'react-router-dom';
import { Box, FormControl, InputLabel, OutlinedInput, InputAdornment, IconButton, Paper, Typography } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import ChecklistIcon from '@mui/icons-material/Checklist';
import Button from '@mui/material/Button';
import Logo from "../assets/Logo1.png";

const Register = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [username]: value });

    if (name === 'password') {
      // Password validation regex
      const passwordRegex = /^(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
      if (!passwordRegex.test(value)) {
        setPasswordError('Password must be at least 8 characters and contain at least one special character.');
      } else {
        setPasswordError('');
      }
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prevState) => !prevState);
  };

  const handleClickShowPassword = () => setShowPassword((show) => !show);

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Password validation (similar to your Login)
    const passwordRegex = /^(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      setPasswordError(
        'Password must be at least 8 characters and contain at least one special character.'
      );
      return;
    } else {
      setPasswordError('');
    }

    try {
      await createUser(formData);
      alert('User registered successfully!');
      navigate('/login');
    } catch (error) {
      console.error('Failed to register user:', error);
      alert('Failed to register user. Please try again.');
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
       
      <Box
        flex={1}
        bgcolor="#091057"
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
      >
        <img src={Logo} alt="TaskBuster Logo" style={{ maxWidth: "500px", marginBottom: "20px" }} />
        <Typography color="white" fontFamily="Poppins" textAlign="center">
        </Typography>
      </Box>

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
            variant="h4"
            fontFamily="Poppins"
            fontWeight="bold"
            textAlign="center"
            color="#091057"
            marginBottom={3}
          >
            Register
          </Typography>
          <form onSubmit={handleSubmit}>

              {/* Username Field */}
              <FormControl sx={{ m: 1, width: '25ch' }} variant="outlined">
                <InputLabel htmlFor="username">Username</InputLabel>
                <OutlinedInput
                  id="username"
                  name="username"
                  type="username"
                  value={formData.username}
                  onChange={handleChange}
                  label="username"
                  required
                  sx={{ minWidth: 300 }}
                />
              </FormControl>

              {/* Password Field */}
              <FormControl sx={{ m: 1, width: '25ch' }} variant="outlined">
                <InputLabel htmlFor="outlined-adornment-password">Password</InputLabel>
                <OutlinedInput
                  id="outlined-adornment-password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  type={showPassword ? 'text' : 'password'}
                  endAdornment={
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={showPassword ? 'hide the password' : 'display the password'}
                        onClick={handleClickShowPassword}
                        onMouseDown={handleMouseDownPassword}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  }
                  label="Password"
                  required
                  sx={{ minWidth: 300 }}
                />
              </FormControl>
              {passwordError && <Typography textAlign="center">{passwordError}</Typography>}
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
             }}>
              Register
            </Button>
          </form>
        </Box>
      </Box>
      </Box> 
    </div>
  );
};

export default Register;
