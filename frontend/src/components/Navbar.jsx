// frontend/src/components/Navbar.jsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole'));

  useEffect(() => {
    // Listen for changes to localStorage (e.g., login/logout in other tabs) and custom authChanged event
    const handleStorage = () => {
      setIsLoggedIn(!!localStorage.getItem('token'));
      setUserRole(localStorage.getItem('userRole'));
    };
    window.addEventListener('storage', handleStorage);
    window.addEventListener('authChanged', handleStorage);
    // Also check on mount
    handleStorage();
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('authChanged', handleStorage);
    };
  }, []);

  const handleLogout = () => {
    // Clear all auth/user info from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    setIsLoggedIn(false);
    setUserRole(null);
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <Link to="/dashboard" className="brand-link">
          <img 
            src="/src/assets/sngce.jpg" 
            alt="Workflow Logo" 
            className="nav-logo"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <span className="brand-text">Workflow</span>
        </Link>
      </div>
      <div className="nav-links">
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/submission/new">New Submission</Link>
        {isLoggedIn ? (
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        ) : (
          <button onClick={() => navigate('/login')} className="logout-btn">Login</button>
        )}
      </div>
    </nav>
  );
}

export default Navbar; 