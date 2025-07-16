// frontend/src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import ReceivedForms from './ReceivedForms';

function getUserRole() {
  return localStorage.getItem('userRole') || 'staff';
}

function Dashboard() {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState(getUserRole());
  console.log(userRole);

  useEffect(() => {
    setUserRole(getUserRole());
  }, []);

  // TODO: Replace with real submissions from backend/API
  const submissions = [];

  const renderStudentDashboard = () => {
    const studentSubmissions = submissions.filter(s => s.owner === 'student');
    return (
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h2>My Submissions <span className="role-badge student">Student</span></h2>
          <div style={{ display: 'flex', gap: 12 }}>
            <button 
              className="new-submission-btn"
              onClick={() => navigate('/submission/new')}
            >
              New Submission
            </button>
            <button
              className="new-submission-btn"
              style={{ background: '#fff', color: '#667eea', border: '1px solid #667eea' }}
              onClick={() => navigate('/mysubmission')}
            >
              My Submission
            </button>
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
                {studentSubmissions.map(submission => (
                  <tr key={submission.id}>
                    <td>#{submission.id}</td>
                    <td>{submission.subject}</td>
                    <td>{submission.department}</td>
                    <td>
                      <span className={`status ${submission.status.toLowerCase()}`}>
                        {submission.status}
                      </span>
                    </td>
                    <td>{submission.date}</td>
                    <td>{submission.currentReviewer}</td>
                    <td>
                      <button 
                        className="view-btn"
                        onClick={() => navigate(`/submission/${submission.id}`)}
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
  };

  const renderStaffDashboard = () => {
    const staffSubmissions = submissions.filter(s => s.owner === 'staff');
    const staffSubmissionsPreview = staffSubmissions.slice(0, 5);
    return (
      <div className="dashboard-content">
        <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>All Submissions <span className="role-badge staff">Staff</span></h2>
          <div>
            <button 
              className="new-submission-btn"
              onClick={() => navigate('/submission/new')}
            >
              New Submission
            </button>
            <button
              className="view-all-btn"
              style={{ marginLeft: 12, background: '#3182ce', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 500 }}
              onClick={() => navigate('/mysubmission')}
            >
              View All
            </button>
          </div>
        </div>
        <div className="submissions-table">
          {staffSubmissionsPreview.length === 0 ? (
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
                {staffSubmissionsPreview.map(submission => (
                  <tr key={submission.id}>
                    <td>#{submission.id}</td>
                    <td>{submission.subject}</td>
                    <td>{submission.department}</td>
                    <td>
                      <span className={`status ${submission.status.toLowerCase()}`}>
                        {submission.status}
                      </span>
                    </td>
                    <td>{submission.date}</td>
                    <td>{submission.currentReviewer}</td>
                    <td>
                      <button 
                        className="view-btn"
                        onClick={() => navigate(`/submission/${submission.id}`)}
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
        {/* Received Forms Section */}
        <div style={{ marginTop: '2.5rem' }}>
          <ReceivedForms previewMode={true} />
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard-page">
      {userRole === 'student' ? renderStudentDashboard() : renderStaffDashboard()}
    </div>
  );
}

export default Dashboard; 