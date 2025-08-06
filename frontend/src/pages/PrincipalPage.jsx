// frontend/src/pages/PrincipalPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from "jwt-decode";
import axios from 'axios';
import Archive from './Archive';
import './PrincipalPage.css';

const statusColors = {
  awaiting: '#fbbf24', // yellow
  forwarded: '#3b82f6', // blue
  accepted: '#22c55e', // green
  rejected: '#ef4444', // red
};

function PrincipalPage() {
  const navigate = useNavigate();
  const [receivedSubmissions, setReceivedSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('current'); // 'current' or 'archived'

  const handleRefresh = () => {
    console.log('Manual refresh triggered');
    window.location.reload();
  };

  useEffect(() => {
    const token = jwtDecode(localStorage.getItem('token'));
    if (!token) {
      navigate('/login');
      return;
    }
    
    // Check if user is actually a principal
    if (token.role !== 'Principal' && token.role !== 'principal') {
      navigate('/dashboard');
      return;
    }

    const email = token.email;
    const role = token.role;
    
    console.log('Principal page loaded for user:', email, role);
    
    const fetchReceived = async () => {
      try {
        let url = `http://localhost:3096/getReceivedFormsForUser?email=${encodeURIComponent(email)}&role=${encodeURIComponent(role)}`;
        
        const res = await axios.get(url);
        console.log('Received forms data for Principal:', res.data);
        setReceivedSubmissions(res.data || []);
      } catch (err) {
        console.error('Error fetching received forms:', err);
        setError('Failed to fetch received submissions');
      } finally {
        setLoading(false);
      }
    };
    
    fetchReceived();
  }, [navigate]);

  if (loading) {
    return (
      <div className="principal-page">
        <div style={{ padding: 40, textAlign: 'center' }}>Loading received forms...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="principal-page">
        <div style={{ padding: 40, textAlign: 'center', color: 'red' }}>{error}</div>
      </div>
    );
  }

  return (
    <div className="principal-page">
      {/* Header */}
      <div className="principal-header">
        <div className="principal-title">
          <h1>Principal Dashboard</h1>
          <span className="role-badge principal">Principal</span>
        </div>
        <p className="principal-subtitle">Review and manage all forms submitted to you</p>
      </div>

      {/* View Mode Toggle and Refresh */}
      <div className="view-controls">
        <div className="view-toggle">
          <button
            onClick={() => setViewMode('current')}
            className={viewMode === 'current' ? 'active' : ''}
          >
            Current Forms
          </button>
          <button
            onClick={() => setViewMode('archived')}
            className={viewMode === 'archived' ? 'active' : ''}
          >
            Form History
          </button>
        </div>
        <button
          onClick={handleRefresh}
          className="refresh-btn"
          title="Refresh data"
        >
          🔄 Refresh
        </button>
      </div>

      {viewMode === 'current' ? (
        <div className="principal-content">
          <div className="received-forms-section">
            <h2>Received Forms</h2>
            <div className="submissions-table">
              {receivedSubmissions.length === 0 ? (
                <div className="no-forms">
                  <div className="no-forms-icon">📋</div>
                  <h3>No forms received yet</h3>
                  <p>Forms submitted to you will appear here for review</p>
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Form No</th>
                      <th>Subject</th>
                      <th>Department</th>
                      <th>Submitted By</th>
                      <th>Status</th>
                      <th>Date</th>
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
                          <div className="submitter-info">
                            <span className="submitter-name">{submission.submittedBy}</span>
                            <span className="submitter-role">{submission.owner}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`status ${submission.status?.toLowerCase?.() || ''}`}>
                            {submission.status}
                          </span>
                        </td>
                        <td>
                          {submission.createdAt 
                            ? new Date(submission.createdAt).toLocaleString() 
                            : (submission.date 
                                ? new Date(submission.date).toLocaleDateString() 
                                : 'N/A'
                              )
                          }
                        </td>
                        <td>
                          <div className="action-buttons" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            <button
                              className="view-btn"
                              onClick={() => navigate(`/received-forms/${submission._id || submission.id}`)}
                              style={{ 
                                padding: '4px 8px', 
                                fontSize: '0.75rem',
                                background: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                              }}
                            >
                              View
                            </button>
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span
                            className="status-dot"
                            style={{
                              background: statusColors[submission.status?.toLowerCase?.()] || '#888',
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


        </div>
      ) : (
        <div className="archived-section">
          <Archive />
        </div>
      )}
    </div>
  );
}

export default PrincipalPage; 