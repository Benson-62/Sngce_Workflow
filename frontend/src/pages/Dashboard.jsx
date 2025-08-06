// frontend/src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import { jwtDecode } from "jwt-decode";



function RoleDashboard({ userRole, submissions, navigate }) {
  if (userRole === 'student' || userRole === 'Student') {
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
                {staffSubmissions.map(submission => (
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
  useEffect(() => {
<<<<<<< Updated upstream
      var token = jwtDecode(localStorage.getItem('token'));
      console.log(token)
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