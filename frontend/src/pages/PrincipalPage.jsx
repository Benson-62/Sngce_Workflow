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
  approved: '#22c55e', // green
  edit: '#f59e0b', // orange
};

function PrincipalPage() {
  const navigate = useNavigate();
  const [receivedSubmissions, setReceivedSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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
        userRole,
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
    const token = jwtDecode(localStorage.getItem('token'));
    if (!token) {
      navigate('/login');
      return;
    }
    
    // Check if user is actually a principal
    if (token.role !== 'Principal') {
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
                          <div className="action-buttons">
                            <button
                              className="view-btn"
                              onClick={() => navigate(`/received-forms/${submission._id || submission.id}`)}
                            >
                              View
                            </button>
                            {submission.status === 'awaiting' && (
                              <button
                                className="review-btn"
                                onClick={() => {
                                  setEditRows(prev => ({
                                    ...prev,
                                    [submission._id]: {
                                      remarks: submission.remarks || '',
                                      status: submission.status || 'awaiting'
                                    }
                                  }));
                                }}
                              >
                                Review
                              </button>
                            )}
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

          {/* Review Modal for forms that need attention */}
          {Object.keys(editRows).length > 0 && (
            <div className="review-modal">
              <div className="review-modal-content">
                <h3>Review Form</h3>
                {Object.entries(editRows).map(([formId, editData]) => {
                  const form = receivedSubmissions.find(f => f._id === formId);
                  if (!form) return null;
                  
                  return (
                    <div key={formId} className="review-form">
                      <div className="review-form-header">
                        <h4>Form #{form.formNo} - {form.subject}</h4>
                        <button
                          className="close-btn"
                          onClick={() => setEditRows(prev => {
                            const newRows = { ...prev };
                            delete newRows[formId];
                            return newRows;
                          })}
                        >
                          ×
                        </button>
                      </div>
                      
                      <div className="review-form-body">
                        <div className="form-field">
                          <label>Status:</label>
                          <select
                            value={editData.status || 'awaiting'}
                            onChange={(e) => handleEditChange(formId, 'status', e.target.value)}
                          >
                            <option value="awaiting">Awaiting</option>
                            <option value="forwarded">Forwarded</option>
                            <option value="accepted">Accepted</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </div>
                        
                        <div className="form-field">
                          <label>Remarks:</label>
                          <textarea
                            value={editData.remarks || ''}
                            onChange={(e) => handleEditChange(formId, 'remarks', e.target.value)}
                            placeholder="Add your remarks here..."
                            rows="4"
                          />
                        </div>
                        
                        <div className="form-actions">
                          <button
                            className="save-btn"
                            onClick={() => handleSave(form)}
                            disabled={editData.saving}
                          >
                            {editData.saving ? 'Saving...' : 'Save Changes'}
                          </button>
                          <button
                            className="cancel-btn"
                            onClick={() => setEditRows(prev => {
                              const newRows = { ...prev };
                              delete newRows[formId];
                              return newRows;
                            })}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
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