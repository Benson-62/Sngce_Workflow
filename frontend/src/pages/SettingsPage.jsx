// frontend/src/pages/SettingsPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import './SettingsPage.css';

export default function SettingsPage() {
  const navigate = useNavigate();

  // --- User info from JWT ---
  const [userInfo, setUserInfo] = useState({ email: '', role: '', department: '', fName: '', lName: '' });

  // --- Dark mode ---
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

  // --- Notification preference ---
  const [notifsEnabled, setNotifsEnabled] = useState(() => localStorage.getItem('notifEnabled') !== 'false');

  // --- Change password ---
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState(null); // { type: 'success'|'error', text }
  const [pwLoading, setPwLoading] = useState(false);

  // --- Clear notifications ---
  const [clearMsg, setClearMsg] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    try {
      const decoded = jwtDecode(token);
      setUserInfo({
        email: decoded.email || '',
        role: decoded.role || '',
        department: decoded.department || '',
        fName: decoded.fName || '',
        lName: decoded.lName || '',
      });
    } catch {
      navigate('/login');
    }
  }, [navigate]);

  // Apply dark mode class to body
  useEffect(() => {
    document.body.classList.toggle('dark-mode', darkMode);
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const handlePwChange = async (e) => {
    e.preventDefault();
    setPwMsg(null);
    if (pwForm.newPw !== pwForm.confirm) {
      setPwMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (pwForm.newPw.length < 6) {
      setPwMsg({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }
    setPwLoading(true);
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/changePassword`, {
        email: userInfo.email,
        currentPassword: pwForm.current,
        newPassword: pwForm.newPw,
      });
      setPwMsg({ type: 'success', text: 'Password changed successfully!' });
      setPwForm({ current: '', newPw: '', confirm: '' });
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to change password.';
      setPwMsg({ type: 'error', text: msg });
    } finally {
      setPwLoading(false);
    }
  };

  const handleClearNotifs = async () => {
    setClearMsg(null);
    if (!window.confirm('Clear all read notifications?')) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/clearNotifications`, { data: { email: userInfo.email } });
      setClearMsg({ type: 'success', text: 'Read notifications cleared.' });
    } catch {
      setClearMsg({ type: 'error', text: 'Failed to clear notifications.' });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    document.body.classList.remove('dark-mode');
    navigate('/login');
  };

  const handleNotifToggle = (val) => {
    setNotifsEnabled(val);
    localStorage.setItem('notifEnabled', val ? 'true' : 'false');
  };

  const displayName = [userInfo.fName, userInfo.lName].filter(Boolean).join(' ') || userInfo.email;
  const skipDept = ['admin', 'principal', 'manager'].includes(userInfo.role?.toLowerCase());

  return (
    <div className={`settings-page${darkMode ? ' dark' : ''}`}>
      <div className="settings-header">
        <h1>Settings</h1>
        <p>Manage your account preferences and app settings.</p>
      </div>

      {/* ── Account Info ── */}
      <section className="settings-section">
        <div className="section-header">
          <span className="section-icon">ID</span>
          <h2>Account Information</h2>
        </div>
        <div className="section-body">
          <div className="info-row">
            <span className="info-label">Name</span>
            <span className="info-value">{displayName}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Email</span>
            <span className="info-value">{userInfo.email}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Role</span>
            <span className="info-value">
              <span className="role-badge-settings">{userInfo.role}</span>
            </span>
          </div>
          {!skipDept && userInfo.department && (
            <div className="info-row">
              <span className="info-label">Department</span>
              <span className="info-value">{userInfo.department}</span>
            </div>
          )}
        </div>
      </section>

      {/* ── Change Password ── */}
      <section className="settings-section">
        <div className="section-header">
          <span className="section-icon">PW</span>
          <h2>Change Password</h2>
        </div>
        <div className="section-body">
          <form onSubmit={handlePwChange}>
            <div className="settings-form-group">
              <label>Current Password</label>
              <input
                type="password"
                className="settings-input"
                value={pwForm.current}
                onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))}
                placeholder="Enter current password"
                required
              />
            </div>
            <div className="settings-form-group">
              <label>New Password</label>
              <input
                type="password"
                className="settings-input"
                value={pwForm.newPw}
                onChange={e => setPwForm(f => ({ ...f, newPw: e.target.value }))}
                placeholder="At least 6 characters"
                required
              />
            </div>
            <div className="settings-form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                className="settings-input"
                value={pwForm.confirm}
                onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                placeholder="Re-enter new password"
                required
              />
            </div>
            {pwMsg && (
              <div className={`settings-msg ${pwMsg.type}`}>{pwMsg.text}</div>
            )}
            <button type="submit" className="settings-btn btn-primary" disabled={pwLoading}>
              {pwLoading ? 'Saving...' : 'Update Password'}
            </button>
          </form>
        </div>
      </section>

      {/* ── Appearance ── */}
      <section className="settings-section">
        <div className="section-header">
          <span className="section-icon">UI</span>
          <h2>Appearance</h2>
        </div>
        <div className="section-body">
          <div className="toggle-row">
            <div className="toggle-info">
              <h3>Dark Mode</h3>
              <p>Switch between light and dark theme</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={darkMode}
                onChange={e => setDarkMode(e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
      </section>

      {/* ── Notification Preferences ── */}
      <section className="settings-section">
        <div className="section-header">
          <span className="section-icon">NT</span>
          <h2>Notification Preferences</h2>
        </div>
        <div className="section-body">
          <div className="toggle-row">
            <div className="toggle-info">
              <h3>In-App Notifications</h3>
              <p>Show notification bell and alerts in the app</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={notifsEnabled}
                onChange={e => handleNotifToggle(e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          {clearMsg && (
            <div className={`settings-msg ${clearMsg.type}`} style={{ marginTop: 12 }}>{clearMsg.text}</div>
          )}
        </div>
      </section>

      {/* ── About ── */}
      <section className="settings-section">
        <div className="section-header">
          <span className="section-icon">AB</span>
          <h2>About</h2>
        </div>
        <div className="section-body">
          <div className="info-row">
            <span className="info-label">Application</span>
            <span className="info-value">SNGCE Workflow System</span>
          </div>
          <div className="info-row">
            <span className="info-label">Version</span>
            <span className="info-value">1.0.0</span>
          </div>
          <div className="info-row">
            <span className="info-label">College</span>
            <span className="info-value">SNGCE, Kadayiruppu</span>
          </div>
        </div>
      </section>

      {/* ── Danger Zone ── */}
      <section className="settings-section danger-section">
        <div className="section-header">
          <span className="section-icon">!</span>
          <h2>Danger Zone</h2>
        </div>
        <div className="section-body">
          <div className="danger-row">
            <div className="danger-info">
              <h3>Clear Read Notifications</h3>
              <p>Permanently delete all notifications you have already read</p>
            </div>
            <button className="settings-btn btn-secondary" onClick={handleClearNotifs}>
              Clear
            </button>
          </div>
          <div className="danger-row">
            <div className="danger-info">
              <h3>Logout</h3>
              <p>Sign out of your account on this device</p>
            </div>
            <button className="settings-btn btn-danger" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
