// frontend/src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

function getUserRole() {
  return localStorage.getItem('userRole') || 'staff';
}

function Dashboard() {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState(getUserRole());

  useEffect(() => {
    setUserRole(getUserRole());
  }, []);

  // Mock data
  const mockSubmissions = [
    {
      id: 1,
      subject: 'Purchase Request for Office Supplies',
      department: 'IT Department',
      status: 'Pending',
      date: '2024-01-15',
      currentReviewer: 'HoD',
      owner: 'student',
    },
    {
      id: 2,
      subject: 'Travel Expense Reimbursement',
      department: 'Finance',
      status: 'Approved',
      date: '2024-01-10',
      currentReviewer: 'Principal',
      owner: 'staff',
    }
  ];

  const renderStudentDashboard = () => (
    <div className="dashboard-content">
      <div className="dashboard-header">
        <h2>My Submissions <span className="role-badge student">Student</span></h2>
        <button 
          className="new-submission-btn"
          onClick={() => navigate('/submission/new')}
        >
          New Submission
        </button>
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
            {mockSubmissions.filter(s => s.owner === 'student').map(submission => (
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
      </div>
    </div>
  );

  const renderStaffDashboard = () => (
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
            {mockSubmissions.filter(s => s.owner === 'staff').map(submission => (
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
      </div>
    </div>
  );

  return (
    <div className="dashboard-page">
      {userRole === 'student' ? renderStudentDashboard() : renderStaffDashboard()}
    </div>
  );
}

export default Dashboard; 