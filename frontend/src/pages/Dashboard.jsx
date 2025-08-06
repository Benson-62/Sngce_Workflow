// frontend/src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import { jwtDecode } from "jwt-decode";
import axios from 'axios';
import Archive from './Archive';

const statusColors = {
  awaiting: '#fbbf24', // yellow
  forwarded: '#3b82f6', // blue
  accepted: '#22c55e', // green
  rejected: '#ef4444', // red
  approved: '#22c55e', // green
};

function RoleDashboard({ userRole, submissions, navigate }) {
  const handleDeleteForm = async (formId, formType, status) => {
    // Only allow deletion of forms that are still awaiting
    if (status !== 'awaiting') {
      alert('Only forms with "awaiting" status can be deleted. Forms that are being reviewed or completed cannot be deleted.');
      return;
    }

    if (window.confirm('Are you sure you want to delete this form? This action cannot be undone.')) {
      try {
        // Get user info from localStorage
        const token = jwtDecode(localStorage.getItem('token'));
        const userEmail = token.email;
        const userRole = token.role;

        // Map 'staff' to 'faculty' for backend compatibility
        const backendFormType = formType === 'staff' ? 'faculty' : formType;

        await axios.delete('http://localhost:3096/deleteForm', {
          data: { formId, formType: backendFormType, userEmail, userRole }
        });
        
        // Refresh the page to update the data
        window.location.reload();
        
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
  if (userRole === 'admin' || userRole === 'Admin') {
    // Show all forms for admin
    return (
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h2>All Submissions <span className="role-badge admin">Admin</span></h2>
        </div>
        <div className="submissions-table">
          {submissions.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#888' }}>No submissions found.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Submission No</th>
                  <th>Subject</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Current Reviewer</th>
                  <th>Owner</th>
                  <th>Actions</th>
                  <th>Status</th> {/* Status dot */}
                </tr>
              </thead>
              <tbody>
                {submissions.map((submission, idx) => (
                  <tr key={submission._id || submission.id || idx}>
                    <td>
                      <div>{submission._id || submission.id}</div>
                      <div style={{ fontSize: 12, color: '#666' }}>{submission.submittedBy}</div>
                    </td>
                    <td>#{submission.formNo || submission.id || submission._id}</td>
                    <td>{submission.subject}</td>
                    <td>{submission.department}</td>
                    <td>
                      <span className={`status ${submission.status?.toLowerCase?.() || ''}`}>{submission.status}</span>
                    </td>
                    <td>{submission.createdAt ? new Date(submission.createdAt).toLocaleString() : (submission.date ? new Date(submission.date).toLocaleDateString() : '')}</td>
                    <td>{submission.currentReviewer}</td>
                    <td>{submission.owner}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          className="view-btn"
                          onClick={() => navigate(`/submission/${submission._id || submission.id}`)}
                        >
                          View
                        </button>
                        <button 
                          className="delete-btn"
                          style={{
                            background: submission.status === 'awaiting' 
                              ? 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)' 
                              : 'linear-gradient(90deg, #9ca3af 0%, #6b7280 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '6px 12px',
                            fontSize: '0.8rem',
                            cursor: submission.status === 'awaiting' ? 'pointer' : 'not-allowed',
                            fontWeight: '500',
                            transition: 'background-color 0.2s ease',
                            opacity: submission.status === 'awaiting' ? 1 : 0.6
                          }}
                          onClick={() => handleDeleteForm(submission._id, submission.owner, submission.status)}
                          title={submission.status !== 'awaiting' ? 'Only forms with "awaiting" status can be deleted' : 'Delete this form'}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          width: 16,
                          height: 16,
                          borderRadius: '50%',
                          background: statusColors[submission.status?.toLowerCase?.()] || '#888',
                          border: '2px solid #fff',
                          boxShadow: '0 0 2px #aaa',
                        }}
                        title={submission.status}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  } else if (userRole === 'student' || userRole === 'Student') {
    const studentSubmissions = submissions.filter(s => s.owner === 'student');
    return (
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h2>My Submissions <span className="role-badge student">Student</span></h2>
          <div style={{ display: 'flex', gap: 12 }}>
            {/* <button 
              className="new-submission-btn"
              onClick={() => navigate('/submission/new')}
            >
              New Submission
            </button> */}
          </div>
        </div>
        <div className="submissions-table">
          {studentSubmissions.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#888' }}>No submissions found.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Submission No</th>
                  <th>Subject</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Current Reviewer</th>
                  <th>Actions</th>
                  <th>Status</th> {/* New column for status dot */}
                </tr>
              </thead>
              <tbody>
                {studentSubmissions.map((submission, idx) => (
                  <tr key={submission._id || submission.id || idx}>
                    <td>#{submission.formNo || submission.id || submission._id}</td>
                    <td>{submission.subject}</td>
                    <td>{submission.department}</td>
                    <td>
                      <span className={`status ${submission.status?.toLowerCase?.() || ''}`}>
                        {submission.status}
                      </span>
                    </td>
                    <td>{submission.createdAt ? new Date(submission.createdAt).toLocaleString() : (submission.date ? new Date(submission.date).toLocaleDateString() : '')}</td>
                    <td>{submission.currentReviewer}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          className="view-btn"
                          onClick={() => navigate(`/submission/${submission._id || submission.id}`)}
                        >
                          View
                        </button>
                        <button 
                          className="delete-btn"
                          style={{
                            background: submission.status === 'awaiting' 
                              ? 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)' 
                              : 'linear-gradient(90deg, #9ca3af 0%, #6b7280 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '6px 12px',
                            fontSize: '0.8rem',
                            cursor: submission.status === 'awaiting' ? 'pointer' : 'not-allowed',
                            fontWeight: '500',
                            transition: 'background-color 0.2s ease',
                            opacity: submission.status === 'awaiting' ? 1 : 0.6
                          }}
                          onClick={() => handleDeleteForm(submission._id, submission.owner, submission.status)}
                          title={submission.status !== 'awaiting' ? 'Only forms with "awaiting" status can be deleted' : 'Delete this form'}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          width: 16,
                          height: 16,
                          borderRadius: '50%',
                          background: statusColors[submission.status?.toLowerCase?.()] || '#888',
                          border: '2px solid #fff',
                          boxShadow: '0 0 2px #aaa',
                        }}
                        title={submission.status}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  } else {
    const staffSubmissions = submissions.filter(s => s.owner === 'staff');
    return (
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h2>All Submissions <span className="role-badge staff">Staff</span></h2>
          <button 
            className="new-submission-btn"
            onClick={() => navigate('/submission/new')}
          >
            New Submission
          </button>
        </div>
        <div className="submissions-table">
          {staffSubmissions.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#888' }}>No submissions found.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Submission No</th>
                  <th>Subject</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Current Reviewer</th>
                  <th>Actions</th>
                  <th>Status</th> {/* New column for status dot */}
                </tr>
              </thead>
              <tbody>
                {staffSubmissions.map((submission, idx) => (
                  <tr key={submission._id || submission.id || idx}>
                    <td>#{submission.formNo || submission.id || submission._id}</td>
                    <td>{submission.subject}</td>
                    <td>{submission.department}</td>
                    <td>
                      <span className={`status ${submission.status?.toLowerCase?.() || ''}`}>
                        {submission.status}
                      </span>
                    </td>
                    <td>{submission.createdAt ? new Date(submission.createdAt).toLocaleString() : (submission.date ? new Date(submission.date).toLocaleDateString() : '')}</td>
                    <td>{submission.currentReviewer}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          className="view-btn"
                          onClick={() => navigate(`/submission/${submission._id || submission.id}`)}
                        >
                          View
                        </button>
                        <button 
                          className="delete-btn"
                          style={{
                            background: submission.status === 'awaiting' 
                              ? 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)' 
                              : 'linear-gradient(90deg, #9ca3af 0%, #6b7280 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '6px 12px',
                            fontSize: '0.8rem',
                            cursor: submission.status === 'awaiting' ? 'pointer' : 'not-allowed',
                            fontWeight: '500',
                            transition: 'background-color 0.2s ease',
                            opacity: submission.status === 'awaiting' ? 1 : 0.6
                          }}
                          onClick={() => handleDeleteForm(submission._id, submission.owner, submission.status)}
                          title={submission.status !== 'awaiting' ? 'Only forms with "awaiting" status can be deleted' : 'Delete this form'}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          width: 16,
                          height: 16,
                          borderRadius: '50%',
                          background: statusColors[submission.status?.toLowerCase?.()] || '#888',
                          border: '2px solid #fff',
                          boxShadow: '0 0 2px #aaa',
                        }}
                        title={submission.status}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  }
}

function Dashboard() {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState();
  const [submissions, setSubmissions] = useState([]);
  const [receivedSubmissions, setReceivedSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingReceived, setLoadingReceived] = useState(true);
  const [error, setError] = useState('');
  const [errorReceived, setErrorReceived] = useState('');
  const [editRows, setEditRows] = useState({}); // { [formId]: { remarks, status, saving } }
  const [viewMode, setViewMode] = useState('current'); // 'current' or 'archived'

  // Handler for input changes
  const handleEditChange = (formId, field, value) => {
    setEditRows(prev => ({
      ...prev,
      [formId]: {
        ...prev[formId],
        [field]: value,
      },
    }));
  };

  // Handler for save
  const handleSave = async (form) => {
    const formId = form._id || form.id;
    const formType = form.owner === 'student' ? 'student' : 'faculty';
    const { remarks, status } = editRows[formId] || {};
    setEditRows(prev => ({ ...prev, [formId]: { ...prev[formId], saving: true } }));
    try {
      const res = await axios.put('http://localhost:3096/updateFormRemarksStatus', {
        formId,
        formType,
        remarks,
        status,
      });
      // Optimistically update the receivedSubmissions state
      setReceivedSubmissions(prev => prev.map(f => (f._id === formId ? { ...f, remarks, status } : f)));
    } catch (err) {
      alert('Failed to update.');
    } finally {
      setEditRows(prev => ({ ...prev, [formId]: { ...prev[formId], saving: false } }));
    }
  };

  const handleRefresh = () => {
    console.log('Manual refresh triggered');
    window.location.reload();
  };

  useEffect(() => {
<<<<<<< Updated upstream
      var token = jwtDecode(localStorage.getItem('token'));
      if (!token) {
        navigate('/login');
        return;
=======
  const token = jwtDecode(localStorage.getItem('token'));
  if (!token) {
    navigate('/login');
    return;
  }
  setUserRole(token.role);
  const email = token.email;
  const role = token.role;
  const department = token.department;
  // 1. Modify fetchReceived to accept year and div as arguments
  const fetchReceived = async (year, div) => {
    // Use the passed-in year and div. Provide default empty strings if they are undefined.
    const yearToFetch = year || '';
    const divToFetch = div || '';

    try {
      const res = await axios.get(`http://localhost:3096/getReceivedFormsForUser?role=${encodeURIComponent(role)}&department=${encodeURIComponent(department)}&year=${encodeURIComponent(yearToFetch)}&div=${encodeURIComponent(divToFetch)}`);
      console.log(res)
      setReceivedSubmissions(res.data || []);
    } catch (err) {
      setErrorReceived('Failed to fetch received submissions');
    } finally {
      setLoadingReceived(false);
    }
  };

  const fetchFA = async () => {
    try {
      const res = await axios.get(`http://localhost:3096/getFacultyAdvisor?email=${encodeURIComponent(email)}&department=${encodeURIComponent(department)}`);
      
      if (res.data && res.data.length > 0) {
        const yearFromAPI = res.data[0].year;
        const divFromAPI = res.data[0].div;
        
        setYear(yearFromAPI);
        setDiv(divFromAPI);

        // 2. THE FIX: Call fetchReceived from here with the NEW data
        fetchReceived(yearFromAPI, divFromAPI);
      } else {
        // Handle case where FA has no assignments
        fetchReceived(); // Call with no args, so it fetches with empty year/div
>>>>>>> Stashed changes
      }
      setUserRole(token.role);
      const email = token.email;
      const role = token.role;
      
      console.log('Dashboard loaded for user:', email, role);
      const fetchSubmissions = async () => {
        try {
          console.log('Fetching submissions for:', email, role);
          const res = await axios.get(`http://localhost:3096/getFormsForUser?email=${encodeURIComponent(email)}&role=${encodeURIComponent(role)}`);
          console.log('Submissions received:', res.data);
          setSubmissions(res.data || []);
        } catch (err) {
          console.error('Error fetching submissions:', err);
          setError('Failed to fetch submissions');
        } finally {
          setLoading(false);
        }
      };
      const fetchReceived = async () => {
        try {
          const res = await axios.get(`http://localhost:3096/getReceivedFormsForUser?email=${encodeURIComponent(email)}&role=${encodeURIComponent(role)}`);
          console.log('Received forms data:', res.data);
          setReceivedSubmissions(res.data || []);
        } catch (err) {
          console.error('Error fetching received forms:', err);
          setErrorReceived('Failed to fetch received submissions');
        } finally {
          setLoadingReceived(false);
        }
      };
      fetchSubmissions();
      fetchReceived();
    }, [navigate]);
  if (loading) {
    return <div className="dashboard-page"><div style={{ padding: 40, textAlign: 'center' }}>Loading submissions...</div></div>;
  }
  if (error) {
    return <div className="dashboard-page"><div style={{ padding: 40, textAlign: 'center', color: 'red' }}>{error}</div></div>;
  }
  return (
    <div className="dashboard-page">
      {/* View Mode Toggle and Refresh */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        gap: '1rem',
        marginBottom: '2rem',
        background: 'white',
        padding: '1rem',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        maxWidth: '500px',
        margin: '0 auto 2rem auto'
      }}>
        <div style={{ 
          display: 'flex', 
          background: '#f1f5f9', 
          borderRadius: '8px', 
          padding: '4px',
          gap: '4px'
        }}>
          <button
            onClick={() => setViewMode('current')}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '6px',
              background: viewMode === 'current' ? '#3b82f6' : 'transparent',
              color: viewMode === 'current' ? 'white' : '#64748b',
              cursor: 'pointer',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
          >
            Current Forms
          </button>
          <button
            onClick={() => setViewMode('archived')}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '6px',
              background: viewMode === 'archived' ? '#3b82f6' : 'transparent',
              color: viewMode === 'archived' ? 'white' : '#64748b',
              cursor: 'pointer',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
          >
            Form History
          </button>
        </div>
        <button
          onClick={handleRefresh}
          style={{
            padding: '8px 16px',
            border: 'none',
            borderRadius: '6px',
            background: '#10b981',
            color: 'white',
            cursor: 'pointer',
            fontWeight: '500',
            transition: 'all 0.2s ease'
          }}
          title="Refresh data"
        >
          🔄 Refresh
        </button>
      </div>

      {viewMode === 'current' ? (
        <>
          <RoleDashboard userRole={userRole} submissions={submissions} navigate={navigate} />
          <div style={{ marginTop: 48 }}>
            <div className="dashboard-header" style={{ marginBottom: 24 }}>
              <h2 style={{ margin: 0, fontWeight: 700, fontSize: 28}}>Received Submissions</h2>
            </div>
        {loadingReceived ? (
          <div style={{ padding: 40, textAlign: 'center' }}>Loading received submissions...</div>
        ) : errorReceived ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'red' }}>{errorReceived}</div>
        ) : (
          <div className="submissions-table" style={{ marginBottom: 48, maxWidth: 1100, marginLeft: 'auto', marginRight: 'auto', borderRadius: 16, boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)', background: '#fff' }}>
            {receivedSubmissions.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#888' }}>No received submissions found.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th>Submission No</th>
                    <th>Subject</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Current Reviewer</th>
                    <th>Actions</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {receivedSubmissions.map((submission, idx) => (
                    <tr key={submission._id || submission.id || idx}>
                      <td>#{submission.formNo || submission.id || submission._id}</td>
                      <td>{submission.subject}</td>
                      <td>{submission.department}</td>
                      <td>
                        <span className={`status ${submission.status?.toLowerCase?.() || ''}`}>{submission.status}</span>
                      </td>
                      <td>{submission.createdAt ? new Date(submission.createdAt).toLocaleString() : (submission.date ? new Date(submission.date).toLocaleDateString() : '')}</td>
                      <td>{submission.currentReviewer}</td>
                      <td>
                        <button
                          className="view-btn"
                          onClick={() => navigate(`/received-forms/${submission._id || submission.id}`)}
                        >
                          View
                        </button>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            background: statusColors[submission.status?.toLowerCase?.()] || '#888',
                            border: '2px solid #fff',
                            boxShadow: '0 0 2px #aaa',
                          }}
                          title={submission.status}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
        </>
      ) : (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '2.5rem', color: '#1e293b', marginBottom: '0.5rem', fontWeight: '700' }}>
              Form History
            </h1>
            <p style={{ color: '#64748b', fontSize: '1.1rem', margin: '0' }}>
              Completed forms and their final status
            </p>
          </div>
          
          <Archive />
        </div>
      )}
    </div>
  );
}

export default Dashboard; 