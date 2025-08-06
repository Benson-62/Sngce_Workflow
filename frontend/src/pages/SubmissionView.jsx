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
        {/* Show remarks only in received form session */}
        {isReceivedView && submission.remarks && (
          <div style={{ marginTop: 32, padding: 16, background: '#f8f9fa', borderRadius: 8, border: '1px solid #eee' }}>
            <b>Remarks:</b>
            <div style={{ marginTop: 8 }}>{submission.remarks}</div>
          </div>
        )}
        
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