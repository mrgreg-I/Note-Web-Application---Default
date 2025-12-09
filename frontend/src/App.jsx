// MainApp.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import RoutesConfig from './Routes'; // Import the existing user routes
const App = () => {
  const [loggedInUserId, setLoggedInUserId] = useState(null);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [admin, setAdmin] = useState(null);

  // Check login status on initial load
  useEffect(() => {
    const storedAdmin = localStorage.getItem('admin');
    if (storedAdmin) {
      setAdmin(JSON.parse(storedAdmin));
      setIsAdminLoggedIn(true);
    }
  }, []);

  const handleUserLogin = (id) => {
    setLoggedInUserId(id);
  };

  return (
    <Router>
      <Routes>
        {/* User Routes */}
        <Route
          path="/*"
          element={<RoutesConfig loggedInUserId={loggedInUserId} handleLogin={handleUserLogin} />}
        />
      </Routes>
    </Router>
  );
};

export default App;
