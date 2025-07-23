// frontend/src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import { jwtDecode } from "jwt-decode";
import axios from 'axios';


function RoleDashboard({ userRole, submissions, navigate }) {
  if (userRole === 'student' || userRole === 'Student') {
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
      var token = jwtDecode(localStorage.getItem('token'));
      if (!token) {
        navigate('/login');
        return;
      }
      try {
        setUserRole(token.role);
        const email = token.email;
        const role = token.role;
        const fetchSubmissions = async () => {
          try {
            let url = '';
            if (role === 'Student' || role === 'student') {
              url = `http://localhost:3096/getSFormsByUser?email=${encodeURIComponent(email)}`;
            } else {
              url = `http://localhost:3096/getFFormsByUser?email=${encodeURIComponent(email)}`;
            }
            const res = await axios.get(url);
            // Add owner field for filtering in RoleDashboard
            const withOwner = (res.data || []).map(s => ({ ...s, owner: (role === 'Student' || role === 'student') ? 'student' : 'staff' }));
            setSubmissions(withOwner);
          } catch (err) {
            setError('Failed to fetch submissions');
          } finally {
            setLoading(false);
          }
        };
        fetchSubmissions();
      } catch (err) {
        console.error("Invalid token");
        navigate('/login');
      }
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
    </div>
  );
}

export default Dashboard; 