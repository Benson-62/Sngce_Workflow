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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.email || !formData.password) {
      setError('Please enter email and password');
      return;
    }
    // Admin login shortcut
    if (
      formData.email === 'admin@sngce.ac.in' &&
      formData.password === 'admin@123'
    ) {
      localStorage.setItem('token', 'admin-token');
      localStorage.setItem('userRole', 'admin');
      localStorage.setItem('userEmail', 'admin@sngce.ac.in');
      localStorage.setItem('userName', 'Admin');
      navigate('/admin');
      return;
    }
    try {
      const response = await fetch('http://localhost:3096/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, password: formData.password })
      });
      if (!response.ok) {
        const msg = await response.text();
        setError(msg || 'Login failed');
        return;
      }
      const data = await response.json();
      localStorage.setItem('token', data.token);
      localStorage.setItem('userRole', data.role);
      localStorage.setItem('userEmail', data.email);
      localStorage.setItem('userName', `${data.fName} ${data.lName}`);
      navigate('/dashboard');
    } catch (err) {
      setError('Network error');
    }
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
        {/* <p className="register-link">
          Don't have an account? <span onClick={() => navigate('/register')}>Register here</span>
        </p> */}
      </div>
    </div>
  );
}

export default LoginPage; 