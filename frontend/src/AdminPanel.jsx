import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import './AdminPanel.css';

function AdminPanel() {
  const [section, setSection] = useState('dashboard');
  const [siteTitle, setSiteTitle] = useState('SNGCE Workflow');

  // Load real users from backend
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
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

  // Load real forms from backend
  const [facultyForms, setFacultyForms] = useState([]);
  const [studentForms, setStudentForms] = useState([]);
  const [loadingForms, setLoadingForms] = useState(true);

  useEffect(() => {
    const fetchForms = async () => {
      try {
        const [facultyRes, studentRes] = await Promise.all([
          axios.get('http://localhost:3096/getAllFForms'),
          axios.get('http://localhost:3096/getAllSForms')
        ]);
        
        const facultyWithType = facultyRes.data.map(form => ({ ...form, type: 'faculty' }));
        const studentWithType = studentRes.data.map(form => ({ ...form, type: 'student' }));
        
        setFacultyForms(facultyWithType);
        setStudentForms(studentWithType);
      } catch (err) {
        console.error('Error fetching forms:', err);
        setFacultyForms([]);
        setStudentForms([]);
      } finally {
        setLoadingForms(false);
      }
    };
    fetchForms();
  }, []);

  // Combine all forms for display
  const allForms = [...facultyForms, ...studentForms];

  // Add User form state
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [newUser, setNewUser] = useState({
    fName: '',
    lName: '',
    email: '',
    password: '',
    role: 'Student',
    department: 'CSE'
  });

  // CSV import state
  const [csvUsers, setCsvUsers] = useState([]);
  const [csvErrors, setCsvErrors] = useState([]);
  const [isUploadingCsv, setIsUploadingCsv] = useState(false);

  // User management actions
  const handleDeleteUser = (email) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      const updated = users.filter(u => u.email !== email);
      setUsers(updated);
      // TODO: Call backend to delete user
    }
  };

  // Edit User state and actions
  const [editingEmail, setEditingEmail] = useState(null);
  const [editValues, setEditValues] = useState({ fName: '', lName: '', role: '', department: '', year: '', div: '' });

  const startEditUser = (user) => {
    setEditingEmail(user.email);
    setEditValues({
      fName: user.fName || '',
      lName: user.lName || '',
      role: user.role || 'Student',
      department: user.department || 'CSE',
      year: user.year ?? '',
      div: user.div || ''
    });
  };

  const cancelEditUser = () => {
    setEditingEmail(null);
    setEditValues({ fName: '', lName: '', role: 'Student', department: 'CSE', year: '', div: '' });
  };

  const saveEditUser = async (email) => {
    try {
      const payload = { email, updates: { ...editValues } };
      // Convert empty year to undefined
      if (payload.updates.year === '') delete payload.updates.year;
      const res = await axios.put('http://localhost:3096/updateUser', payload);
      const updated = res.data;
      setUsers(prev => prev.map(u => (u.email === email ? { ...u, ...updated } : u)));
      cancelEditUser();
      alert('User updated');
    } catch (err) {
      console.error('Failed updating user', err);
      alert(err.response?.data?.message || 'Failed to update user');
    }
  };

  // Add User functionality
  const handleAddUser = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!newUser.fName || !newUser.lName || !newUser.email || !newUser.password || !newUser.department) {
      alert('Please fill in all required fields');
      return;
    }
    
    if (newUser.password.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }

    try {
      await axios.post('http://localhost:3096/createAccount', newUser);
      
      // Add to local state
      setUsers(prev => [...prev, { ...newUser, password: undefined }]);
      
      // Reset form
      setNewUser({
        fName: '',
        lName: '',
        email: '',
        password: '',
        role: 'Student',
        department: 'CSE'
      });
      
      setShowAddUserForm(false);
      alert('User added successfully!');
      
    } catch (error) {
      console.error('Error adding user:', error);
      alert('Failed to add user. Please try again.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser(prev => ({ ...prev, [name]: value }));
  };

  // CSV utilities
  const expectedHeaders = ['fName','lName','email','password','role','department','div','year'];

  const downloadCsvTemplate = () => {
    const header = 'fName,lName,email,password,role,department,div,year\n';
    const example = 'Jane,Doe,jane.doe@sngce.ac.in,TempPass123,Faculty,CSE,,\n';
    const content = header + example;
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'users_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const parseCsv = (text) => {
    const lines = text.replace(/\r/g, '').split('\n').filter(l => l.trim().length > 0);
    if (lines.length === 0) return { rows: [], errors: ['Empty CSV'] };
    const headerLine = lines[0];
    const headers = headerLine.split(',').map(h => h.trim());
    // Validate headers minimally (must include required ones)
    const required = ['fName','lName','email','password','role','department'];
    const missing = required.filter(h => !headers.includes(h));
    if (missing.length > 0) {
      return { rows: [], errors: [`Missing headers: ${missing.join(', ')}`] };
    }
    const rows = [];
    const errors = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line || line.trim() === '') continue;
      // Simple CSV split; assumes values do not contain embedded commas within quotes
      const cols = line.split(',');
      const row = {};
      headers.forEach((h, idx) => {
        row[h] = (cols[idx] || '').trim();
      });
      // Basic validation
      if (!row.email || !row.password || !row.fName || !row.lName || !row.role || !row.department) {
        errors.push(`Row ${i+1}: missing required fields`);
        continue;
      }
      if (row.year && !/^\d+$/.test(row.year)) {
        errors.push(`Row ${i+1}: year must be a number`);
        continue;
      }
      rows.push({
        fName: row.fName,
        lName: row.lName,
        email: row.email,
        password: row.password,
        role: row.role,
        department: row.department,
        div: row.div || undefined,
        year: row.year ? Number(row.year) : undefined
      });
    }
    return { rows, errors };
  };

  const handleCsvFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv')) {
      alert('Please select a .csv file');
      return;
    }
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target.result;
      const { rows, errors } = parseCsv(text);
      setCsvUsers(rows);
      setCsvErrors(errors);
      if (errors.length > 0) {
        alert(`Found ${errors.length} issue(s) in CSV. Please fix and re-upload.`);
      } else if (rows.length > 0) {
        if (window.confirm(`Upload ${rows.length} users now?`)) {
          // inline upload without waiting for manual button
          setIsUploadingCsv(true);
          try {
            const res = await axios.post('http://localhost:3096/bulkCreateUsers', { users: rows });
            const data = res.data || {};
            try {
              const refreshed = await axios.get('http://localhost:3096/getAllUsers');
              setUsers(refreshed.data || []);
            } catch (_) {}
            alert(`Import complete: ${data.createdCount || 0} created, ${data.failedCount || 0} failed.`);
            setCsvUsers([]);
            setCsvErrors([]);
          } catch (error) {
            console.error('Bulk upload failed', error);
            alert('Bulk upload failed. Please try again.');
          } finally {
            setIsUploadingCsv(false);
          }
        }
      }
    };
    reader.readAsText(file);
    // reset input value so the same file can be reselected after edits
    e.target.value = '';
  };

  // Removed manual upload button; uploading happens after selecting a valid CSV

  // Form management actions
  const handleDeleteForm = async (formId, formType) => {
    if (window.confirm('Are you sure you want to delete this form? This action cannot be undone.')) {
      try {
        // Get user info from localStorage
        const token = jwtDecode(localStorage.getItem('token'));
        const userEmail = token.email;
        const userRole = token.role;

        await axios.delete('http://localhost:3096/deleteForm', {
          data: { formId, formType, userEmail, userRole }
        });
        
        // Update local state after successful deletion
        if (formType === 'faculty') {
          setFacultyForms(prev => prev.filter(form => form._id !== formId));
        } else {
          setStudentForms(prev => prev.filter(form => form._id !== formId));
        }
        
        alert('Form deleted successfully!');
      } catch (error) {
        console.error('Error deleting form:', error);
        if (error.response?.status === 403) {
          alert('You can only delete your own forms.');
        } else if (error.response?.status === 400) {
          alert(error.response.data || 'Only forms with "awaiting" status can be deleted.');
        } else {
          alert('Failed to delete form. Please try again.');
        }
      }
    }
  };

  // Admin settings actions
  const handleSiteTitleChange = (e) => setSiteTitle(e.target.value);



  return (
    <div className="admin-panel">
      <div className="admin-container">
        <div className="admin-header">
          <h1>{siteTitle} <span>(Admin)</span></h1>
          <p>Manage users, forms, and system settings</p>
        </div>
        <nav className="admin-tabs">
          <button className={`admin-tab ${section === 'dashboard' ? 'active' : ''}`} onClick={() => setSection('dashboard')}>Dashboard</button>
          <button className={`admin-tab ${section === 'users' ? 'active' : ''}`} onClick={() => setSection('users')}>User Management</button>
          <button className={`admin-tab ${section === 'submissions' ? 'active' : ''}`} onClick={() => setSection('submissions')}>Submissions</button>
          <button className={`admin-tab ${section === 'received' ? 'active' : ''}`} onClick={() => setSection('received')}>Received</button>
          <button className={`admin-tab ${section === 'settings' ? 'active' : ''}`} onClick={() => setSection('settings')}>Settings</button>
        </nav>
              <div className="admin-content">
          {section === 'dashboard' && (
            <div className="admin-section">
              <h2>Dashboard</h2>
              <div className="admin-stats">
                <div className="stat-card">
                  <h3>Users</h3>
                  <p>{users.length}</p>
                </div>
                <div className="stat-card">
                  <h3>Faculty Forms</h3>
                  <p>{facultyForms.length}</p>
                </div>
                <div className="stat-card">
                  <h3>Student Forms</h3>
                  <p>{studentForms.length}</p>
                </div>
              </div>
              <p>Welcome to the admin dashboard. Use the navigation above to manage the site.</p>
            </div>
          )}
                  {section === 'users' && (
              <div className="admin-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '12px', flexWrap: 'wrap' }}>
                <h2>User Management</h2>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button 
                    className="admin-btn" 
                    onClick={() => setShowAddUserForm(!showAddUserForm)}
                    style={{ background: '#22c55e' }}
                  >
                    {showAddUserForm ? 'Cancel' : '+ Add User'}
                  </button>
                  <button 
                    className="admin-btn" 
                    type="button"
                    onClick={downloadCsvTemplate}
                    style={{ background: '#0ea5e9' }}
                  >
                    Download CSV Template
                  </button>
                  <label className="admin-btn" style={{ cursor: 'pointer', background: '#6366f1' }}>
                    Upload CSV
                    <input type="file" accept=".csv" onChange={handleCsvFileChange} style={{ display: 'none' }} />
                  </label>
                  
                </div>
              </div>

              {(csvUsers.length > 0 || csvErrors.length > 0) && (
                <div style={{ background: '#f8fafc', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <span>Parsed users: <b>{csvUsers.length}</b></span>
                    <span>Errors: <b style={{ color: csvErrors.length ? '#dc2626' : '#16a34a' }}>{csvErrors.length}</b></span>
                  </div>
                  {csvErrors.length > 0 && (
                    <ul style={{ marginTop: '8px', color: '#b91c1c' }}>
                      {csvErrors.slice(0, 5).map((er, idx) => (
                        <li key={idx}>• {er}</li>
                      ))}
                      {csvErrors.length > 5 && <li>…and {csvErrors.length - 5} more</li>}
                    </ul>
                  )}
                </div>
              )}
              
              {showAddUserForm && (
                <div style={{ 
                  background: '#f8fafc', 
                  padding: '24px', 
                  borderRadius: '8px', 
                  border: '1px solid #e2e8f0', 
                  marginBottom: '24px' 
                }}>
                  <h3 style={{ marginTop: 0, marginBottom: '16px', color: '#374151' }}>Add New User</h3>
                  <form onSubmit={handleAddUser}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '14px' }}>
                          First Name *
                        </label>
                        <input
                          type="text"
                          name="fName"
                          value={newUser.fName}
                          onChange={handleInputChange}
                          required
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '14px'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '14px' }}>
                          Last Name *
                        </label>
                        <input
                          type="text"
                          name="lName"
                          value={newUser.lName}
                          onChange={handleInputChange}
                          required
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '14px'
                          }}
                        />
                      </div>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '14px' }}>
                          Email *
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={newUser.email}
                          onChange={handleInputChange}
                          required
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '14px'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '14px' }}>
                          Password *
                        </label>
                        <input
                          type="password"
                          name="password"
                          value={newUser.password}
                          onChange={handleInputChange}
                          required
                          minLength="6"
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '14px'
                          }}
                        />
                      </div>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '14px' }}>
                          Role *
                        </label>
                        <select
                          name="role"
                          value={newUser.role}
                          onChange={handleInputChange}
                          required
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '14px'
                          }}
                        >
                          <option value="Student">Student</option>
                          <option value="Faculty">Faculty</option>
                          <option value="FacultyAdvisor">Faculty Advisor</option>
                          <option value="HOD">HOD</option>
                          <option value="Principal">Principal</option>
                          <option value="Admin">Admin</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '14px' }}>
                          Department *
                        </label>
                        <select
                          name="department"
                          value={newUser.department}
                          onChange={handleInputChange}
                          required
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '14px'
                          }}
                        >
                          <option value="CSE">Computer Science & Engineering</option>
                          <option value="NASB">NASB</option>
                          <option value="ECE">Electronics & Communication Engineering</option>
                          <option value="EEE">Electrical & Electronics Engineering</option>
                          <option value="ME">Mechanical Engineering</option>
                          <option value="CE">Civil Engineering</option>
                          <option value="AI">Artificial Intelligence</option>
                          <option value="CS">Computer Science</option>
                          <option value="MCA">Master of Computer Applications</option>
                        </select>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button 
                        type="submit" 
                        className="admin-btn"
                        style={{ background: '#3b82f6' }}
                      >
                        Create User
                      </button>
                      <button 
                        type="button" 
                        className="admin-btn"
                        style={{ background: '#6b7280' }}
                        onClick={() => setShowAddUserForm(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}
              
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Department</th>
                    <th>Year</th>
                    <th>Div</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.email} style={{ background: u.role === 'Admin' ? '#e0e7ef' : 'inherit' }}>
                      <td>
                        {editingEmail === u.email ? (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <input value={editValues.fName} onChange={e => setEditValues(v => ({ ...v, fName: e.target.value }))} style={{ width: 100 }} />
                            <input value={editValues.lName} onChange={e => setEditValues(v => ({ ...v, lName: e.target.value }))} style={{ width: 100 }} />
                          </div>
                        ) : (
                          <>{u.fName || '-'} {u.lName || ''}</>
                        )}
                      </td>
                      <td>{u.email}</td>
                      <td>
                        {editingEmail === u.email ? (
                          <select value={editValues.role} onChange={e => setEditValues(v => ({ ...v, role: e.target.value }))}>
                            <option value="Student">Student</option>
                            <option value="Faculty">Faculty</option>
                            <option value="FacultyAdvisor">Faculty Advisor</option>
                            <option value="HOD">HOD</option>
                            <option value="Principal">Principal</option>
                            <option value="Admin">Admin</option>
                          </select>
                        ) : (
                          u.role
                        )}
                      </td>
                      <td>
                        {editingEmail === u.email ? (
                          <select value={editValues.department} onChange={e => setEditValues(v => ({ ...v, department: e.target.value }))}>
                            <option value="CSE">CSE</option>
                            <option value="NASB">NASB</option>
                            <option value="ECE">ECE</option>
                            <option value="EEE">EEE</option>
                            <option value="ME">ME</option>
                            <option value="CE">CE</option>
                            <option value="AI">AI</option>
                            <option value="CS">CS</option>
                            <option value="MCA">MCA</option>
                          </select>
                        ) : (
                          u.department || 'N/A'
                        )}
                      </td>
                      <td>
                        {editingEmail === u.email ? (
                          <input value={editValues.year} onChange={e => setEditValues(v => ({ ...v, year: e.target.value }))} style={{ width: 60 }} />
                        ) : (
                          u.year ?? ''
                        )}
                      </td>
                      <td>
                        {editingEmail === u.email ? (
                          <input value={editValues.div} onChange={e => setEditValues(v => ({ ...v, div: e.target.value }))} style={{ width: 60 }} />
                        ) : (
                          u.div || ''
                        )}
                      </td>
                      <td>
                        {editingEmail === u.email ? (
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <button className="admin-btn" style={{ background: '#22c55e' }} onClick={() => saveEditUser(u.email)}>Save</button>
                            <button className="admin-btn" style={{ background: '#6b7280' }} onClick={cancelEditUser}>Cancel</button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <button className="admin-btn" onClick={() => startEditUser(u)}>Edit</button>
                            {u.role !== 'Admin' && (
                              <button className="admin-btn" onClick={() => handleDeleteUser(u.email)}>Delete</button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && (
                <div className="no-data">No users found.</div>
              )}
            </div>
          )}
                  {section === 'submissions' && (
            <div className="admin-section">
              <h2>All Forms Management</h2>
              {loadingForms ? (
                <div className="loading">Loading forms...</div>
              ) : (
                <>
                  <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <span style={{ 
                      background: '#f1f5f9', 
                      padding: '4px 12px', 
                      borderRadius: '20px', 
                      fontSize: '0.9rem'
                    }}>
                      Total Forms: {allForms.length}
                    </span>
                    <span style={{ 
                      background: '#f1f5f9', 
                      padding: '4px 12px', 
                      borderRadius: '20px', 
                      fontSize: '0.9rem'
                    }}>
                      Faculty: {facultyForms.length}
                    </span>
                    <span style={{ 
                      background: '#f1f5f9', 
                      padding: '4px 12px', 
                      borderRadius: '20px', 
                      fontSize: '0.9rem'
                    }}>
                      Student: {studentForms.length}
                    </span>
                  </div>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Form No</th>
                        <th>Type</th>
                        <th>Subject</th>
                        <th>Department</th>
                        <th>Status</th>
                        <th>Submitted By</th>
                        <th>Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allForms.map(form => (
                        <tr key={form._id}>
                          <td>#{form.formNo}</td>
                          <td>
                            <span style={{ 
                              background: form.type === 'faculty' ? '#3b82f6' : '#10b981', 
                              color: 'white', 
                              padding: '2px 8px', 
                              borderRadius: '4px', 
                              fontSize: '0.8rem' 
                            }}>
                              {form.type === 'faculty' ? 'Faculty' : 'Student'}
                            </span>
                          </td>
                          <td>{form.subject}</td>
                          <td>{form.department || 'N/A'}</td>
                          <td>
                            <span style={{ 
                              background: form.status === 'accepted' ? '#22c55e' : 
                                         form.status === 'rejected' ? '#ef4444' : 
                                         form.status === 'forwarded' ? '#3b82f6' : '#fbbf24', 
                              color: 'white', 
                              padding: '2px 8px', 
                              borderRadius: '4px', 
                              fontSize: '0.8rem' 
                            }}>
                              {form.status}
                            </span>
                          </td>
                          <td>{form.submittedBy}</td>
                          <td>
                            {new Date(form.createdAt).toLocaleDateString()}
                          </td>
                          <td>
                            <button 
                              className="admin-btn"
                              onClick={() => handleDeleteForm(form._id, form.type)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {allForms.length === 0 && (
                    <div className="no-data">
                      No forms found.
                    </div>
                  )}
                </>
              )}
            </div>
          )}
          {section === 'received' && (
            <div className="admin-section">
              <h2>Form Analytics</h2>
              <div className="admin-stats">
                <div className="stat-card">
                  <h3>Total Forms</h3>
                  <p>{allForms.length}</p>
                </div>
                <div className="stat-card">
                  <h3>Pending</h3>
                  <p>{allForms.filter(f => f.status === 'awaiting').length}</p>
                </div>
                <div className="stat-card">
                  <h3>Completed</h3>
                  <p>{allForms.filter(f => f.status === 'accepted' || f.status === 'rejected').length}</p>
                </div>
                <div className="stat-card">
                  <h3>In Progress</h3>
                  <p>{allForms.filter(f => f.status === 'forwarded').length}</p>
                </div>
              </div>
              <p className="no-data" style={{ textAlign: 'center' }}>
                Use the "Submissions" tab to manage individual forms and delete them if needed.
              </p>
            </div>
          )}
          {section === 'settings' && (
            <div className="admin-section" style={{ maxWidth: 500, marginLeft: 'auto', marginRight: 'auto' }}>
              <h2>Admin Settings</h2>
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
                    background: '#f1f5f9',
                    color: '#222',
                  }}
                />
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
    </div>
  );
}

export default AdminPanel; 