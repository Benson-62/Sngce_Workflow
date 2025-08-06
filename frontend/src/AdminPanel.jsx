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

  // User management actions
  const handleDeleteUser = (email) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      const updated = users.filter(u => u.email !== email);
      setUsers(updated);
      // TODO: Call backend to delete user
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>User Management</h2>
                <button 
                  className="admin-btn" 
                  onClick={() => setShowAddUserForm(!showAddUserForm)}
                  style={{ background: '#22c55e' }}
                >
                  {showAddUserForm ? 'Cancel' : '+ Add User'}
                </button>
              </div>
              
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
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.email} style={{ background: u.role === 'Admin' ? '#e0e7ef' : 'inherit' }}>
                      <td>{u.fName || '-'} {u.lName || ''}</td>
                      <td>{u.email}</td>
                      <td>{u.role}</td>
                      <td>{u.department || 'N/A'}</td>
                      <td>
                        {u.role !== 'Admin' && (
                          <button className="admin-btn" onClick={() => handleDeleteUser(u.email)}>Delete</button>
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