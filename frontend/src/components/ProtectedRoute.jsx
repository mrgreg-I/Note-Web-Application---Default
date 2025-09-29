// ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ isLoggedIn, children }) => {
  const storedAdmin = localStorage.getItem('admin');

  if (!isLoggedIn && !storedAdmin) {
    return <Navigate to="/" />;
  }

  return children;
};

export default ProtectedRoute;
