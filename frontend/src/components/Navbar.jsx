// frontend/src/components/Navbar.jsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { jwtDecode } from "jwt-decode";
import NotificationBell from './NotificationBell';
import './Navbar.css';

function Navbar() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole'));
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Listen for changes to localStorage (e.g., login/logout in other tabs) and custom authChanged event
    const handleStorage = () => {
      const token = localStorage.getItem('token');
      setIsLoggedIn(!!token);

      // Get role from localStorage first, then fallback to JWT token
      let role = localStorage.getItem('userRole');
      if (!role && token) {
        try {
          const decoded = jwtDecode(token);
          role = decoded.role;
          // Store it in localStorage for future use
          localStorage.setItem('userRole', role);
        } catch (error) {
          console.error('Error decoding token:', error);
        }
      }

      console.log('Navbar: Current user role:', role); // Debug log
      setUserRole(role);
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

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

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

      <button
        className={`mobile-menu-toggle ${isMobileMenuOpen ? 'active' : ''}`}
        onClick={toggleMobileMenu}
        aria-label="Toggle mobile menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>


      <div className={`nav-links ${isMobileMenuOpen ? 'active' : ''}`}>
        {isLoggedIn ? (
          <>
            {/* Hide Dashboard from Principal and Admin users */}
            {!(userRole === 'Principal' || userRole === 'principal' || userRole === 'admin' || userRole === 'Admin') && (
              <Link to="/dashboard" onClick={closeMobileMenu}>Dashboard</Link>
            )}
            <Link to="/ProfilePage" onClick={closeMobileMenu}>Profile</Link>
            {/* Hide New Submission for Principal users since they only review forms */}
            {!(userRole === 'Principal' || userRole === 'principal') && (
              <Link to="/submission/new" onClick={closeMobileMenu}>New Submission</Link>
            )}
            {userRole === 'admin' && (
              <>
                <Link to="/admin" onClick={closeMobileMenu}>Admin</Link>
                <Link to="/admin/users" onClick={closeMobileMenu}>Users</Link>
                <Link to="/admin/logs" onClick={closeMobileMenu}>Logs</Link>
              </>
            )}
            {/* Principal Panel - Only show for Principal role */}
            {(userRole === 'Principal' || userRole === 'principal') && (
              <Link to="/principal" onClick={closeMobileMenu}>Principal Panel</Link>
            )}
            <NotificationBell />
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </>
        ) : null}
      </div>
    </nav>
  );
}

export default Navbar; 