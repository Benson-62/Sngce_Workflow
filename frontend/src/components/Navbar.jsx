// frontend/src/components/Navbar.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
  const navigate = useNavigate();
  // Get user role from localStorage
  const userRole = localStorage.getItem('userRole') || 'originator';

  const handleLogout = () => {
    // Clear all auth/user info from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <Link to={userRole === 'admin' ? '/admin' : '/dashboard'} className="brand-link">
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
        <Link to={userRole === 'admin' ? '/admin' : '/dashboard'}>Dashboard</Link>
        <Link to="/submission/new">New Submission</Link>
        {userRole === 'admin' && (
          <Link to="/admin">Admin</Link>
        )}
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>
    </nav>
  );
}

export default Navbar; 