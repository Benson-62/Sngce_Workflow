// frontend/src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import { jwtDecode } from "jwt-decode";
import axios from 'axios';

const statusColors = {
  awaiting: '#fbbf24', // yellow
  forwarded: '#3b82f6', // blue
  accepted: '#22c55e', // green
  rejected: '#ef4444', // red
  approved: '#22c55e', // green
};

function RoleDashboard({ userRole, submissions, navigate }) {
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
                      <button 
                        className="view-btn"
                        onClick={() => navigate(`/submission/${submission._id || submission.id}`)}
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
                      <button 
                        className="view-btn"
                        onClick={() => navigate(`/submission/${submission._id || submission.id}`)}
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
                  <th>Status</th>{/* New column for status dot */}
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
                      <button 
                        className="view-btn"
                        onClick={() => navigate(`/submission/${submission._id || submission.id}`)}
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
  // const handleSave = async (form) => {
  //   const formId = form._id || form.id;
  //   const formType = form.owner === 'student' ? 'student' : 'faculty';
  //   const { remarks, status } = editRows[formId] || {};
  //   setEditRows(prev => ({ ...prev, [formId]: { ...prev[formId], saving: true } }));
  //   console.log({formId, formType, remarks, status})
  //   try {
  //     const res = await axios.put('http://localhost:3096/updateFormRemarksStatus', {
  //       formId,
  //       formType,
  //       remarks,
  //       status,
  //     });
  //     // Optimistically update the receivedSubmissions state
  //     setReceivedSubmissions(prev => prev.map(f => (f._id === formId ? { ...f, remarks, status } : f)));
  //   } catch (err) {
  //     alert('Failed to update.');
  //   } finally {
  //     setEditRows(prev => ({ ...prev, [formId]: { ...prev[formId], saving: false } }));
  //   }
  // };

  useEffect(() => {
      var token = jwtDecode(localStorage.getItem('token'));
      if (!token) {
        navigate('/login');
        return;
      }
      setUserRole(token.role);
      const email = token.email;
      const role = token.role;
      const fetchSubmissions = async () => {
        try {
          const res = await axios.get(`http://localhost:3096/getFormsForUser?email=${encodeURIComponent(email)}&role=${encodeURIComponent(role)}`);
          setSubmissions(res.data || []);
        } catch (err) {
          setError('Failed to fetch submissions');
        } finally {
          setLoading(false);
        }
      };
      const fetchReceived = async () => {
        try {
          const res = await axios.get(`http://localhost:3096/getReceivedFormsForUser?email=${encodeURIComponent(email)}&role=${encodeURIComponent(role)}`);
          setReceivedSubmissions(res.data || []);
        } catch (err) {
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
      <RoleDashboard userRole={userRole} submissions={submissions} navigate={navigate} />
      <div style={{ marginTop: 48 }}>
        <h2 style={{ marginBottom: 16 }}>Received Submissions</h2>
        {loadingReceived ? (
          <div style={{ padding: 40, textAlign: 'center' }}>Loading received submissions...</div>
        ) : errorReceived ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'red' }}>{errorReceived}</div>
        ) : (
          <div className="submissions-table" style={{ marginBottom: 48, maxWidth: 1100, marginLeft: 'auto', marginRight: 'auto' }}>
            {receivedSubmissions.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#888' }}>No received submissions found.</div>
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
    </div>
  );
}

export default Dashboard; 