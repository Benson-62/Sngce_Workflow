import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import WelcomeAnimation from '../pages/WelcomeAnimation';
import './LoginPage.css';

function detectRole(email) {
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
  const [showAnimation, setShowAnimation] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAnimationComplete = () => {
    const role = localStorage.getItem('userRole');
    if (role === 'principal' || role === 'Principal') {
      navigate('/principal');
    } else if (role === 'admin' || role === 'Admin') {
      navigate('/admin');
    } else {
      navigate('/dashboard');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.email || !formData.password) {
      setError('Please enter email and password');
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/login`, {
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
      localStorage.setItem('userName', `${data.fName} ${data.lName}`);
      localStorage.setItem('userRole', data.role);
      localStorage.setItem('userEmail', data.email);
      window.dispatchEvent(new Event('authChanged'));
      
      // Show animation before navigation
      setShowAnimation(true);
      
    } catch (err) {
      setError('Network error');
    }
  };

  return (
    <>
      {showAnimation && <WelcomeAnimation onComplete={handleAnimationComplete} />}
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
        </div>
      </div>
    </>
  );
}

export default LoginPage;