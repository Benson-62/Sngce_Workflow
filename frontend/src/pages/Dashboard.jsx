// ===============================
// File: src/pages/Dashboard.jsx
// Description: Main dashboard page for students and staff. Shows submissions and received forms.
// ===============================
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import { jwtDecode } from "jwt-decode";

// RoleDashboard: Renders dashboard content based on user role (student/staff)
function RoleDashboard({ userRole, submissions, navigate }) {
  if (userRole === 'student' || userRole === 'Student') {
    const studentSubmissions = submissions.filter(s => s.owner === 'student');
    const showViewAll = studentSubmissions.length > 5;
    const displayedSubmissions = showViewAll ? studentSubmissions.slice(0, 5) : studentSubmissions;
    return (
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h2>My Submissions <span className="role-badge student">Student</span></h2>
          <div style={{ display: 'flex', gap: 12 }}>
            {showViewAll && (
              <button className="view-all-btn" onClick={() => {/* TODO: handle view all */}}>
                View All
              </button>
            )}
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
              {displayedSubmissions.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', color: '#888', padding: '32px' }}>
                    No submissions found.
                  </td>
                </tr>
              ) : (
                displayedSubmissions.map(submission => (
                  <tr key={submission.id}>
                    <td>#{submission.id}</td>
                    <td>{submission.subject}</td>
                    <td>{submission.department}</td>
                    <td>
                      <span className={`status ${submission.status?.toLowerCase?.() || ''}`}>
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  } else {
    const staffSubmissions = submissions.filter(s => s.owner === 'staff');
    const showViewAllSub = staffSubmissions.length > 5;
    const displayedStaffSub = showViewAllSub ? staffSubmissions.slice(0, 5) : staffSubmissions;
    // Placeholder for received forms (replace with real data as needed)
    const receivedForms = [];
    const showViewAllReceived = receivedForms.length > 5;
    const displayedReceivedForms = showViewAllReceived ? receivedForms.slice(0, 5) : receivedForms;
    return (
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h2>All Submissions <span className="role-badge staff">Staff</span></h2>
          <div style={{ display: 'flex', gap: 12 }}>
            {showViewAllSub && (
              <button className="view-all-btn" onClick={() => {/* TODO: handle view all */}}>
                View All
              </button>
            )}
            <button 
              className="new-submission-btn"
              onClick={() => navigate('/submission/new')}
            >
              New Submission
            </button>
          </div>
        </div>
        <div className="submissions-table">
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
              {displayedStaffSub.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', color: '#888', padding: '32px' }}>
                    No submissions found.
                  </td>
                </tr>
              ) : (
                displayedStaffSub.map(submission => (
                  <tr key={submission.id}>
                    <td>#{submission.id}</td>
                    <td>{submission.subject}</td>
                    <td>{submission.department}</td>
                    <td>
                      <span className={`status ${submission.status?.toLowerCase?.() || ''}`}>
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
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* New Receiver Box Section */}
        <div className="receiver-box" style={{ marginTop: 32, position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#333' }}>Received Forms</h3>
            {showViewAllReceived && (
              <button className="view-all-btn" onClick={() => {/* TODO: handle view all */}}>
                View All
              </button>
            )}
          </div>
          <div className="submissions-table">
            <table>
              <thead>
                <tr>
                  <th>Form No</th>
                  <th>Sender</th>
                  <th>Subject</th>
                  <th>Date Received</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {displayedReceivedForms.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: '#888', padding: '32px' }}>
                      No forms received.
                    </td>
                  </tr>
                ) : (
                  displayedReceivedForms.map(form => (
                    <tr key={form.id} className={`row-status-${form.status?.toLowerCase?.() || ''}`}>
                      <td>#{form.id}</td>
                      <td>{form.sender}</td>
                      <td>{form.subject}</td>
                      <td>{form.dateReceived}</td>
                      <td>{form.status}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }
}

// Dashboard: Handles user authentication and passes data to RoleDashboard
function Dashboard() {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState();
  useEffect(() => {
      var token = jwtDecode(localStorage.getItem('token'));
      console.log(token)
      if (!token) {
        navigate('/login');
        return;
      }
      try {
        setUserRole(token.role)
      } catch (err) {
        console.error("Invalid token");
        navigate('/login');
      }
    }, []);
  // TODO: Replace with real submissions from backend/API
  const submissions = [];
  return (
    <div className="dashboard-page">
      <RoleDashboard userRole={userRole} submissions={submissions} navigate={navigate} />
    </div>
  );
}

export default Dashboard; 