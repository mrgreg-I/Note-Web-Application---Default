// src/RoutesConfig.jsx
import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import Register from './components/Register';
import Login from './components/Login';
import TaskView from './components/TaskView';
import TaskUpdate from './components/TaskUpdate';
import TaskCreate from './components/TaskCreate';
import TaskDetails from './components/TaskDetails';

const RoutesConfig = ({ loggedInUserId, handleLogin }) => (
  <Routes>
  <Route path="/" element={<Navigate to="/register" />} />
    <Route path="/register" element={<Register />} />
    <Route path="/login" element={<Login onLogin={handleLogin} />} />
    <Route path="/tasks" element={<TaskView userId={loggedInUserId} />} />
    {/*<Route path="/taskview/:toDoListID" element={<TaskView />} /> */}
    <Route path="/taskupdate/:taskId" element={<TaskUpdate/>}/>
    <Route path="/createTask" element={<TaskCreate/>}/>
    <Route path="/taskdetails/" element={<TaskDetails/>}/>    
  </Routes>
);

export default RoutesConfig;
