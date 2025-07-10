// frontend/src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';

function detectRole(email) {
  // Student: sng + 2 digits + dept (3-4 letters) + 3 digits (e.g., sng23cse123)
  const studentRegex = /^sng\d{2}[a-zA-Z]{2,4}\d{3}/i;
  if (studentRegex.test(email.split('@')[0])) return 'student';
  return 'staff';
}

function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Implement real login logic
    if (!formData.email || !formData.password) {
      setError('Please enter email and password');
      return;
    }
    const role = detectRole(formData.email);
    localStorage.setItem('userRole', role);
    localStorage.setItem('userEmail', formData.email);
    navigate('/dashboard');
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h2>Login</h2>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          {error && <div className="error-msg">{error}</div>}
          <button type="submit" className="login-btn">Login</button>
        </form>
        <p className="register-link">
          Don't have an account? <span onClick={() => navigate('/register')}>Register here</span>
        </p>
      </div>
    </div>
  );
}

export default LoginPage; 