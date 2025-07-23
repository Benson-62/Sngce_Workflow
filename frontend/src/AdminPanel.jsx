import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BUTTON_STYLE = {
  background: 'linear-gradient(90deg, #2563eb 0%, #1e293b 100%)',
  color: 'white',
  border: 'none',
  borderRadius: 8,
  padding: '10px 24px',
  fontWeight: 600,
  fontSize: 16,
  margin: '0 4px',
  cursor: 'pointer',
  boxShadow: '0 2px 8px rgba(30,41,59,0.10)',
  transition: 'background 0.3s, transform 0.2s',
};
const BUTTON_ACTIVE = {
  ...BUTTON_STYLE,
  background: 'linear-gradient(90deg, #1e293b 0%, #2563eb 100%)',
  transform: 'scale(1.05)',
};

function AdminPanel() {
  const [section, setSection] = useState('dashboard');
  const [theme, setTheme] = useState('light');
  const [siteTitle, setSiteTitle] = useState('SNGCE Workflow');

  // Load real users from backend
  const [users, setUsers] = useState([]);
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get('http://localhost:3096/getAllUsers');
        setUsers(res.data || []);
      } catch (err) {
        setUsers([]);
      }
    };
    fetchUsers();
  }, []);

  // Demo: Load submissions and received messages from localStorage (can be replaced with backend)
  const [submissions, setSubmissions] = useState(
    JSON.parse(localStorage.getItem('mysubmissions') || '[]')
  );
  const [receivedMessages, setReceivedMessages] = useState(
    JSON.parse(localStorage.getItem('receivedMessages') || '[]')
  );

  // User management actions
  const handleDeleteUser = (email) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      const updated = users.filter(u => u.email !== email);
      setUsers(updated);
      // TODO: Call backend to delete user
    }
  };

  // Submission management actions
  const handleDeleteSubmission = (id) => {
    if (window.confirm('Are you sure you want to delete this submission?')) {
      const updated = submissions.filter(s => s.id !== id);
      setSubmissions(updated);
      localStorage.setItem('mysubmissions', JSON.stringify(updated));
    }
  };

  // Received message management actions
  const handleDeleteReceived = (id) => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      const updated = receivedMessages.filter(m => m.id !== id);
      setReceivedMessages(updated);
      localStorage.setItem('receivedMessages', JSON.stringify(updated));
    }
  };

  // Admin settings actions
  const handleThemeToggle = () => setTheme(theme === 'light' ? 'dark' : 'light');
  const handleSiteTitleChange = (e) => setSiteTitle(e.target.value);

  // Panel background and card styles
  const panelBg = theme === 'light'
    ? '#f4f6fa'
    : 'linear-gradient(135deg, #1e293b 0%, #334155 100%)';
  const cardBg = theme === 'light' ? '#fff' : '#232946';
  const textColor = theme === 'light' ? '#222' : '#f1f5f9';
  const accent = theme === 'light' ? '#2563eb' : '#60a5fa';
  const statCardBg = theme === 'light' ? '#f1f5f9' : '#334155';

  return (
    <div style={{ maxWidth: 1100, margin: '40px auto', borderRadius: 16, boxShadow: '0 4px 24px #b2bdfa22', padding: 32, background: panelBg, color: textColor, minHeight: 700 }}>
      <h1 style={{ textAlign: 'center', marginBottom: 32, fontWeight: 800, letterSpacing: 2, fontSize: 38 }}>{siteTitle} <span style={{ fontSize: 18, fontWeight: 400, color: accent }}>(Admin)</span></h1>
      <nav style={{ display: 'flex', justifyContent: 'center', marginBottom: 32, gap: 12 }}>
        <button style={section === 'dashboard' ? BUTTON_ACTIVE : BUTTON_STYLE} onClick={() => setSection('dashboard')}>Dashboard</button>
        <button style={section === 'users' ? BUTTON_ACTIVE : BUTTON_STYLE} onClick={() => setSection('users')}>User Management</button>
        <button style={section === 'submissions' ? BUTTON_ACTIVE : BUTTON_STYLE} onClick={() => setSection('submissions')}>Submissions</button>
        <button style={section === 'received' ? BUTTON_ACTIVE : BUTTON_STYLE} onClick={() => setSection('received')}>Received</button>
        <button style={section === 'settings' ? BUTTON_ACTIVE : BUTTON_STYLE} onClick={() => setSection('settings')}>Settings</button>
      </nav>
      <div>
        {section === 'dashboard' && (
          <div>
            <h2 style={{ color: accent, fontWeight: 700 }}>Dashboard</h2>
            <br></br>
            <div className="admin-stats" style={{ display: 'flex', gap: 20, marginBottom: 30 }}>
              <div className="stat-card" style={{ flex: 1, background: statCardBg, borderRadius: 14, padding: 24, textAlign: 'center', boxShadow: '0 2px 10px #e5e7eb' }}>
                <h3 style={{ color: accent, fontWeight: 700 }}>Users</h3>
                <p style={{ fontSize: 36, color: textColor, margin: 0 }}>{users.length}</p>
              </div>
              <div className="stat-card" style={{ flex: 1, background: statCardBg, borderRadius: 14, padding: 24, textAlign: 'center', boxShadow: '0 2px 10px #e5e7eb' }}>
                <h3 style={{ color: accent, fontWeight: 700 }}>Submissions</h3>
                <p style={{ fontSize: 36, color: textColor, margin: 0 }}>{submissions.length}</p>
              </div>
              <div className="stat-card" style={{ flex: 1, background: statCardBg, borderRadius: 14, padding: 24, textAlign: 'center', boxShadow: '0 2px 10px #e5e7eb' }}>
                <h3 style={{ color: accent, fontWeight: 700 }}>Received</h3>
                <p style={{ fontSize: 36, color: textColor, margin: 0 }}>{receivedMessages.length}</p>
              </div>
            </div>
            <p style={{ fontSize: 18, fontWeight: 500 }}>Welcome to the admin dashboard. Use the navigation above to manage the site.</p>
          </div>
        )}
        {section === 'users' && (
          <div style={{ background: cardBg, borderRadius: 12, padding: 24, boxShadow: '0 2px 10px #e5e7eb', marginBottom: 24 }}>
            <h2 style={{ color: accent, fontWeight: 700 }}>User Management</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20, color: textColor }}>
              <thead>
                <tr style={{ background: '#f1f5f9' }}>
                  <th style={{ padding: 12, borderBottom: '1px solid #e5e7eb' }}>Name</th>
                  <th style={{ padding: 12, borderBottom: '1px solid #e5e7eb' }}>Email</th>
                  <th style={{ padding: 12, borderBottom: '1px solid #e5e7eb' }}>Role</th>
                  <th style={{ padding: 12, borderBottom: '1px solid #e5e7eb' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.email} style={{ background: u.role === 'Admin' ? '#e0e7ef' : 'inherit' }}>
                    <td style={{ padding: 12, borderBottom: '1px solid #e5e7eb' }}>{u.fName || '-'} {u.lName || ''}</td>
                    <td style={{ padding: 12, borderBottom: '1px solid #e5e7eb' }}>{u.email}</td>
                    <td style={{ padding: 12, borderBottom: '1px solid #e5e7eb' }}>{u.role}</td>
                    <td style={{ padding: 12, borderBottom: '1px solid #e5e7eb' }}>
                      {u.role !== 'Admin' && (
                        <button style={{ ...BUTTON_STYLE, background: 'linear-gradient(90deg, #ef4444 0%, #1e293b 100%)' }} onClick={() => handleDeleteUser(u.email)}>Delete</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={{ color: '#888' }}>To add users, use the registration page. (Admin cannot be deleted.)</p>
          </div>
        )}
        {section === 'submissions' && (
          <div style={{ background: cardBg, borderRadius: 12, padding: 24, boxShadow: '0 2px 10px #e5e7eb', marginBottom: 24 }}>
            <h2 style={{ color: accent, fontWeight: 700 }}>Submissions Overview</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20, color: textColor }}>
              <thead>
                <tr style={{ background: '#f1f5f9' }}>
                  <th style={{ padding: 12, borderBottom: '1px solid #e5e7eb' }}>Subject</th>
                  <th style={{ padding: 12, borderBottom: '1px solid #e5e7eb' }}>Department</th>
                  <th style={{ padding: 12, borderBottom: '1px solid #e5e7eb' }}>Date</th>
                  <th style={{ padding: 12, borderBottom: '1px solid #e5e7eb' }}>Owner</th>
                  <th style={{ padding: 12, borderBottom: '1px solid #e5e7eb' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map(sub => (
                  <tr key={sub.id}>
                    <td style={{ padding: 12, borderBottom: '1px solid #e5e7eb' }}>{sub.subject}</td>
                    <td style={{ padding: 12, borderBottom: '1px solid #e5e7eb' }}>{sub.department}</td>
                    <td style={{ padding: 12, borderBottom: '1px solid #e5e7eb' }}>{sub.date}</td>
                    <td style={{ padding: 12, borderBottom: '1px solid #e5e7eb' }}>{sub.owner}</td>
                    <td style={{ padding: 12, borderBottom: '1px solid #e5e7eb' }}>
                      <button style={{ ...BUTTON_STYLE, background: 'linear-gradient(90deg, #ef4444 0%, #1e293b 100%)' }} onClick={() => handleDeleteSubmission(sub.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {section === 'received' && (
          <div style={{ background: cardBg, borderRadius: 12, padding: 24, boxShadow: '0 2px 10px #e5e7eb', marginBottom: 24 }}>
            <h2 style={{ color: accent, fontWeight: 700 }}>Received Messages</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20, color: textColor }}>
              <thead>
                <tr style={{ background: '#f1f5f9' }}>
                  <th style={{ padding: 12, borderBottom: '1px solid #e5e7eb' }}>From</th>
                  <th style={{ padding: 12, borderBottom: '1px solid #e5e7eb' }}>Subject</th>
                  <th style={{ padding: 12, borderBottom: '1px solid #e5e7eb' }}>Date</th>
                  <th style={{ padding: 12, borderBottom: '1px solid #e5e7eb' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {receivedMessages.map(msg => (
                  <tr key={msg.id}>
                    <td style={{ padding: 12, borderBottom: '1px solid #e5e7eb' }}>{msg.from || '-'}</td>
                    <td style={{ padding: 12, borderBottom: '1px solid #e5e7eb' }}>{msg.subject}</td>
                    <td style={{ padding: 12, borderBottom: '1px solid #e5e7eb' }}>{msg.date}</td>
                    <td style={{ padding: 12, borderBottom: '1px solid #e5e7eb' }}>
                      <button style={{ ...BUTTON_STYLE, background: 'linear-gradient(90deg, #ef4444 0%, #1e293b 100%)' }} onClick={() => handleDeleteReceived(msg.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {section === 'settings' && (
          <div style={{ background: cardBg, borderRadius: 12, padding: 24, boxShadow: '0 2px 10px #e5e7eb', marginBottom: 24, maxWidth: 500, marginLeft: 'auto', marginRight: 'auto' }}>
            <h2 style={{ color: accent, fontWeight: 700 }}>Admin Settings</h2>
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontWeight: 600, fontSize: 16 }}>Site Title:</label>
              <input
                type="text"
                value={siteTitle}
                onChange={handleSiteTitleChange}
                style={{
                  width: '100%',
                  padding: 10,
                  borderRadius: 8,
                  border: '1px solid #e5e7eb',
                  marginTop: 8,
                  fontSize: 16,
                  background: theme === 'light' ? '#f1f5f9' : '#232946',
                  color: textColor,
                }}
              />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontWeight: 600, fontSize: 16 }}>Theme:</label>
              <button
                style={{ ...BUTTON_STYLE, background: theme === 'light' ? 'linear-gradient(90deg, #2563eb 0%, #1e293b 100%)' : 'linear-gradient(90deg, #232946 0%, #60a5fa 100%)', marginLeft: 16 }}
                onClick={handleThemeToggle}
              >
                {theme === 'light' ? 'Switch to Dark' : 'Switch to Light'}
              </button>
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontWeight: 600, fontSize: 16 }}>Admin Email:</label>
              <input
                type="text"
                value="admin@sngce.ac.in"
                readOnly
                style={{
                  width: '100%',
                  padding: 10,
                  borderRadius: 8,
                  border: '1px solid #e5e7eb',
                  marginTop: 8,
                  fontSize: 16,
                  background: '#f1f5f9',
                  color: '#888',
                }}
              />
            </div>
            <div style={{ color: '#888', fontSize: 14 }}>
              <b>Note:</b> These settings are for demo only and not persisted.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPanel; 