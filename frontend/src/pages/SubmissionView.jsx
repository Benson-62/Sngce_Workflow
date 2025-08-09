import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { jwtDecode } from "jwt-decode";
import axios from 'axios';

const statusLabels = {
  awaiting: 'Awaiting',
  forwarded: 'Forwarded',
  accepted: 'Accepted',
  rejected: 'Rejected',
  approved: 'Approved',
};
const statusColors = {
  awaiting: '#fbbf24', // yellow
  forwarded: '#3b82f6', // blue
  accepted: '#22c55e', // green
  rejected: '#ef4444', // red
  approved: '#22c55e', // green
};

export default function SubmissionView() {
  const { id } = useParams();
  const location = useLocation();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());
  
  // Form action states
  const [remarks, setRemarks] = useState('');
  const [forwardTo, setForwardTo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Get current user info
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setCurrentUser(decoded);
      } catch (err) {
        console.error('Invalid token');
      }
    }

    const fetchSubmission = async () => {
      setLoading(true);
      setError('');
      try {
        let res = await axios.get(`http://localhost:3096/getSFormById/${id}`);
        setSubmission(res.data);
      } catch (err1) {
        try {
          let res = await axios.get(`http://localhost:3096/getFFormById/${id}`);
          setSubmission(res.data);
        } catch (err2) {
          setError('Submission not found or failed to load.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchSubmission();
    
    // Set up auto-refresh for real-time status updates
    const refreshInterval = setInterval(() => {
      // Only refresh if the page is visible
      if (document.visibilityState === 'visible') {
        console.log('Auto-refreshing submission data...');
        fetchSubmission();
        setLastUpdateTime(Date.now());
      }
    }, 15000); // 15 seconds for more frequent updates on individual forms
    
    // Cleanup interval on unmount
    return () => clearInterval(refreshInterval);
  }, [id]);

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>;
  if (error) return <div style={{ padding: 40, textAlign: 'center', color: 'red' }}>{error}</div>;
  if (!submission) return null;

  const status = submission.status || 'awaiting';
  const statusLabel = statusLabels[status] || status;
  const statusColor = statusColors[status] || '#888';

  // Determine if this is a received form view (e.g., via location.state)
  const isReceivedView = location.state?.fromReceived || false;
  
  // Check if current user can see tracking (sender or receiver)
  const canSeeTracking = currentUser && (
    submission.submittedBy === currentUser.email || 
    (Array.isArray(submission.to) ? submission.to.includes(currentUser.role) : submission.to === currentUser.role)
  );

  // Check if current user can perform actions (receiver only, not sender)
  const canPerformActions = currentUser && 
    submission.submittedBy !== currentUser.email && 
    (Array.isArray(submission.to) ? submission.to.includes(currentUser.role) : submission.to === currentUser.role);

  // Handle form actions
  const handleFormAction = async (action, actionRemarks = '') => {
    if (!canPerformActions) {
      alert('You are not authorized to perform this action.');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = jwtDecode(localStorage.getItem('token'));
      const backendFormType = submission.owner === 'staff' ? 'faculty' : submission.owner;
      
      await axios.put('http://localhost:3096/updateFormRemarksStatus', {
        formId: submission._id,
        formType: backendFormType,
        status: action,
        remarks: actionRemarks || remarks,
        forwardTo: forwardTo || undefined
      });
      
      // Refresh the submission data
      const fetchSubmission = async () => {
        try {
          let res = await axios.get(`http://localhost:3096/getSFormById/${id}`);
          setSubmission(res.data);
        } catch (err1) {
          try {
            let res = await axios.get(`http://localhost:3096/getFFormById/${id}`);
            setSubmission(res.data);
          } catch (err2) {
            console.error('Failed to refresh submission');
          }
        }
      };
      await fetchSubmission();
      
      // Reset form
      setRemarks('');
      setForwardTo('');
      alert(`Form ${action} successfully!`);
      
    } catch (error) {
      console.error('Error performing action:', error);
      alert('Failed to perform action. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle accept action
  const handleAccept = () => {
    if (window.confirm('Are you sure you want to accept this form?')) {
      handleFormAction('accepted', remarks);
    }
  };

  // Handle reject action
  const handleReject = () => {
    if (!remarks.trim()) {
      alert('Please provide remarks when rejecting a form.');
      return;
    }
    if (window.confirm('Are you sure you want to reject this form?')) {
      handleFormAction('rejected', remarks);
    }
  };

  // Handle request edit action
  const handleRequestEdit = () => {
    if (!remarks.trim()) {
      alert('Please provide remarks when requesting edits.');
      return;
    }
    if (window.confirm('Are you sure you want to request edits for this form?')) {
      handleFormAction('request_edit', remarks);
    }
  };

  // Handle forward action
  const handleForward = () => {
    if (!forwardTo) {
      alert('Please select someone to forward to.');
      return;
    }
    if (window.confirm(`Are you sure you want to forward this form to ${forwardTo}?`)) {
      handleFormAction('forwarded', remarks);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', minHeight: '80vh', background: '#f8f9fa', padding: 40, gap: 24 }}>
      {/* Status Bar */}
      <div style={{ width: 16, minHeight: 400, background: statusColor, borderRadius: 8, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 20, left: 24, color: statusColor, fontWeight: 'bold', writingMode: 'vertical-rl', textOrientation: 'mixed', fontSize: 18, letterSpacing: 2 }}>
          {statusLabel}
        </div>
      </div>
      
      {/* Main Content Container */}
      <div style={{ display: 'flex', gap: 24, flex: 1, maxWidth: 1200 }}>
      {/* Letter Format */}
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px #eee', padding: 40, minWidth: 400, flex: 1 }}>
        <div style={{ textAlign: 'right', marginBottom: 16 }}>
          <div><b>Date:</b> {submission.createdAt ? new Date(submission.createdAt).toLocaleString() : ''}</div>
          <div><b>No:</b> {submission.formNo || submission._id}</div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <div>To,</div>
          <div style={{ marginLeft: 32 }}>{Array.isArray(submission.to) ? submission.to.join(', ') : submission.to}</div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <div><b>Subject:</b> {submission.subject}</div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <div>Respected Sir/Madam,</div>
          <div style={{ marginTop: 16, marginLeft: 32 }}>{submission.details}</div>
        </div>
        {submission.attachment && submission.attachment.filename && (
          <div style={{ marginBottom: 16, marginLeft: 32 }}>
            <b>Attachment:</b> {submission.attachment.filename}
          </div>
        )}
        <div style={{ marginTop: 32 }}>
          <div><b>Department:</b> {submission.department}</div>
          <div><b>Submitted By:</b> {submission.submittedBy}</div>
        </div>
        
        {/* Form History/Roadmap */}
        {submission.history && submission.history.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <h3 style={{ color: '#374151', marginBottom: 16, borderBottom: '2px solid #e5e7eb', paddingBottom: 8 }}>
              Form Roadmap & History
            </h3>
            <div style={{ position: 'relative' }}>
              {/* Timeline line */}
              <div style={{ 
                position: 'absolute', 
                left: 15, 
                top: 0, 
                bottom: 0, 
                width: 2, 
                background: '#d1d5db' 
              }} />
              
              {submission.history.map((entry, index) => (
                <div key={index} style={{ 
                  position: 'relative', 
                  paddingLeft: 40, 
                  paddingBottom: 24,
                  marginBottom: index === submission.history.length - 1 ? 0 : 16
                }}>
                  {/* Timeline dot */}
                  <div style={{
                    position: 'absolute',
                    left: 8,
                    top: 4,
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    background: index === 0 ? '#22c55e' : '#3b82f6',
                    border: '3px solid white',
                    boxShadow: '0 0 0 3px #e5e7eb'
                  }} />
                  
                  <div style={{ 
                    background: '#f9fafb',
                    padding: 16,
                    borderRadius: 8,
                    border: '1px solid #e5e7eb'
                  }}>
                    <div style={{ 
                      fontWeight: 'bold', 
                      color: '#374151',
                      marginBottom: 4
                    }}>
                      {entry.action}
                    </div>
                    <div style={{ 
                      fontSize: '0.9rem', 
                      color: '#6b7280',
                      marginBottom: 8
                    }}>
                      By: {entry.by} • {new Date(entry.timestamp).toLocaleString()}
                    </div>
                    {entry.remarks && (
                      <div style={{ 
                        color: '#374151',
                        fontSize: '0.9rem',
                        fontStyle: 'italic'
                      }}>
                        "{entry.remarks}"
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Tracking Panel - Right Side */}
      {canSeeTracking && (
        <div style={{ 
          background: '#fff', 
          borderRadius: 12, 
          boxShadow: '0 2px 12px #eee', 
          padding: 24, 
          width: 300,
          height: 'fit-content',
          position: 'sticky',
          top: 24
        }}>
          <h3 style={{ 
            margin: '0 0 20px 0', 
            color: '#374151', 
            fontSize: '1.2rem',
            borderBottom: '2px solid #e5e7eb',
            paddingBottom: 8
          }}>
            📍 Form Tracking
          </h3>
          
          {/* Current Status */}
          <div style={{ 
            background: `linear-gradient(135deg, ${statusColor}20, ${statusColor}10)`,
            border: `2px solid ${statusColor}`,
            borderRadius: 8,
            padding: 16,
            marginBottom: 20,
            textAlign: 'center'
          }}>
            <div style={{ fontWeight: 'bold', color: statusColor, fontSize: '1.1rem' }}>
              {statusLabel}
            </div>
            <div style={{ fontSize: '0.9rem', color: '#6b7280', marginTop: 4 }}>
              Current Status
            </div>
          </div>
          
          {/* Form Journey */}
          <div style={{ marginBottom: 20 }}>
            <h4 style={{ margin: '0 0 12px 0', color: '#374151', fontSize: '1rem' }}>
              📋 Form Journey
            </h4>
            <div style={{ fontSize: '0.9rem', color: '#6b7280', lineHeight: 1.5 }}>
              <div><strong>Form ID:</strong> {submission.formNo || submission._id}</div>
              <div><strong>Submitted:</strong> {submission.createdAt ? new Date(submission.createdAt).toLocaleDateString() : 'N/A'}</div>
              <div><strong>To:</strong> {Array.isArray(submission.to) ? submission.to.join(', ') : submission.to}</div>
              <div><strong>Department:</strong> {submission.department}</div>
            </div>
          </div>
          
          {/* Progress Steps */}
          <div style={{ marginBottom: 20 }}>
            <h4 style={{ margin: '0 0 12px 0', color: '#374151', fontSize: '1rem' }}>
              🛣️ Progress Steps
            </h4>
            <div style={{ position: 'relative' }}>
              {/* Progress line */}
              <div style={{
                position: 'absolute',
                left: 8,
                top: 0,
                bottom: 0,
                width: 2,
                background: '#e5e7eb'
              }} />
              
              {['Submitted', 'Under Review', 'Processed', 'Completed'].map((step, index) => {
                const isCompleted = (
                  (index === 0) ||
                  (index === 1 && ['forwarded', 'accepted', 'rejected', 'approved'].includes(status)) ||
                  (index === 2 && ['accepted', 'approved'].includes(status)) ||
                  (index === 3 && status === 'approved')
                );
                
                return (
                  <div key={step} style={{ 
                    position: 'relative', 
                    paddingLeft: 28, 
                    paddingBottom: index === 3 ? 0 : 16,
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    {/* Step dot */}
                    <div style={{
                      position: 'absolute',
                      left: 2,
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      background: isCompleted ? '#22c55e' : '#e5e7eb',
                      border: '2px solid white',
                      boxShadow: '0 0 0 2px #e5e7eb'
                    }} />
                    
                    <div style={{
                      fontSize: '0.85rem',
                      color: isCompleted ? '#374151' : '#9ca3af',
                      fontWeight: isCompleted ? '600' : '400'
                    }}>
                      {step}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Real-time Updates Info */}
          <div style={{ 
            background: '#f0f9ff',
            borderRadius: 8,
            padding: 12,
            border: '1px solid #0ea5e9',
            marginBottom: 12
          }}>
            <div style={{ fontSize: '0.85rem', color: '#0369a1' }}>
              <div style={{ fontWeight: 'bold', marginBottom: 4 }}>🔄 Live Updates</div>
              <div style={{ fontSize: '0.8rem' }}>
                Last updated: {new Date(lastUpdateTime).toLocaleTimeString()}
              </div>
              <div style={{ fontSize: '0.75rem', marginTop: 4, fontStyle: 'italic' }}>
                Auto-refresh every 15 seconds
              </div>
            </div>
          </div>

          {/* Form Actions - Only show for receivers */}
          {canPerformActions && (
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#374151', fontSize: '1rem' }}>
                ⚡ Quick Actions
              </h4>
              
              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                <button
                  onClick={handleAccept}
                  disabled={isSubmitting}
                  style={{
                    background: '#22c55e',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    padding: '10px 16px',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    opacity: isSubmitting ? 0.6 : 1
                  }}
                >
                  ✓ Accept Form
                </button>
                
                <button
                  onClick={handleReject}
                  disabled={isSubmitting}
                  style={{
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    padding: '10px 16px',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    opacity: isSubmitting ? 0.6 : 1
                  }}
                >
                  ✗ Reject Form
                </button>
                
                <button
                  onClick={handleRequestEdit}
                  disabled={isSubmitting}
                  style={{
                    background: '#f59e0b',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    padding: '10px 16px',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    opacity: isSubmitting ? 0.6 : 1
                  }}
                >
                  ✏️ Request Edit
                </button>
              </div>
            </div>
          )}

          {/* Remarks Section */}
          {canPerformActions && (
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#374151', fontSize: '1rem' }}>
                💬 Remarks
              </h4>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Add your remarks here..."
                style={{
                  width: '100%',
                  minHeight: 80,
                  padding: 12,
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  fontSize: '0.9rem',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />
            </div>
          )}

          {/* Forward To Section */}
          {canPerformActions && (
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#374151', fontSize: '1rem' }}>
                📤 Forward To
              </h4>
              <select
                value={forwardTo}
                onChange={(e) => setForwardTo(e.target.value)}
                style={{
                  width: '100%',
                  padding: 10,
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  fontSize: '0.9rem',
                  background: 'white'
                }}
              >
                <option value="">Select person to forward</option>
                <option value="FacultyAdvisor">Faculty Advisor</option>
                <option value="HOD">HOD</option>
                <option value="Principal">Principal</option>
                <option value="Manager">Manager</option>
                <option value="Committee">Committee</option>
                <option value="Secretary">Secretary</option>
              </select>
              
              {forwardTo && (
                <button
                  onClick={handleForward}
                  disabled={isSubmitting}
                  style={{
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    padding: '8px 16px',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    opacity: isSubmitting ? 0.6 : 1,
                    marginTop: 8,
                    width: '100%'
                  }}
                >
                  📤 Forward Form
                </button>
              )}
            </div>
          )}

          {/* User Info */}
          <div style={{ 
            background: '#f9fafb',
            borderRadius: 8,
            padding: 12,
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
              <div><strong>Viewing as:</strong></div>
              <div>{currentUser?.role} - {currentUser?.email}</div>
              <div style={{ marginTop: 8, fontSize: '0.8rem', fontStyle: 'italic' }}>
                {submission.submittedBy === currentUser?.email ? '👤 You are the sender' : '📨 You are a receiver'}
              </div>
            </div>
          </div>
          </div>
        )}
      </div>
    </div>
  );
} 