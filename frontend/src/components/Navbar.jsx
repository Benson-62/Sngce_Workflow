// frontend/src/components/Navbar.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
  const navigate = useNavigate();
  // TODO: Get user role from context/state
  const userRole = 'originator'; // Placeholder

  const handleLogout = () => {
    // TODO: Implement logout logic
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <Link to="/dashboard">Submission Workflow</Link>
      </div>
      <div className="nav-links">
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/submission/new">New Submission</Link>
        {userRole === 'admin' && (
          <>
            <Link to="/admin">Admin</Link>
            <Link to="/admin/users">Users</Link>
            <Link to="/admin/logs">Logs</Link>
          </>
        )}
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>
    </nav>
  );
}

export default Navbar; 