// src/RoutesConfig.jsx
import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';


import TaskView from './components/TaskView';
import TaskUpdate from './components/TaskUpdate';
import TaskCreate from './components/TaskCreate';
import TaskDetails from './components/TaskDetails';
import BlockchainDashboard from './components/BlockchainDashboard';

const RoutesConfig = ({ loggedInUserId, handleLogin }) => (
  <Routes>
  <Route path="/" element={<Navigate to="/tasks/" />} />
    
   
    <Route path="/tasks" element={<TaskView userId={loggedInUserId} />} />
    <Route path="/blockchain" element={<BlockchainDashboard userId={loggedInUserId} />} />
    {/*<Route path="/taskview/:toDoListID" element={<TaskView />} /> */}
    <Route path="/taskupdate/:taskId" element={<TaskUpdate/>}/>
    <Route path="/createTask" element={<TaskCreate/>}/>
    <Route path="/taskdetails/" element={<TaskDetails/>}/>    
  </Routes>
);

export default RoutesConfig;
