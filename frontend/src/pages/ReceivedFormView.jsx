import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
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
  edit: '#f59e0b', // orange - needs editing/revision
};

// Role permissions map
const rolePermissions = {
  Principal: { accept: true, reject: true, requestEdit: true },
  principal: { accept: true, reject: true, requestEdit: true },
  Manager: { accept: true, reject: true, requestEdit: true },
  manager: { accept: true, reject: true, requestEdit: true },
  HOD: { accept: false, reject: true, requestEdit: true },
  hod: { accept: false, reject: true, requestEdit: true },
  FacultyAdvisor: { accept: false, reject: true, requestEdit: true },
  facultyadvisor: { accept: false, reject: true, requestEdit: true },
};
const FORWARD_OPTIONS = [
  { label: 'Head of Department (HoD)', value: 'HOD' },
  { label: 'Principal', value: 'Principal' },
  { label: 'Manager', value: 'Manager' },
  { label: 'Committee Convenor', value: 'Committee' },
  { label: 'Secretary', value: 'Secretary' },
];

export default function ReceivedFormView() {
  const { id } = useParams();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [remarks, setRemarks] = useState('');
  const [forwardTo, setForwardTo] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState('');
  const [showSidePanel, setShowSidePanel] = useState(false);

  useEffect(() => {
    const token = jwtDecode(localStorage.getItem('token'));
    if (token){
      setUserRole(token.role);
    }
    
    // Try both student and faculty endpoints
    const fetchForm = async () => {
      setLoading(true);
      setError('');
      try {
        let res = await axios.get(`http://localhost:3096/getSFormById/${id}`);
        setForm(res.data);
        setRemarks(res.data.remarks || '');
      } catch (err1) {
        try {
          let res = await axios.get(`http://localhost:3096/getFFormById/${id}`);
          setForm(res.data);
          setRemarks(res.data.remarks || '');
        } catch (err2) {
          setError('Submission not found or failed to load.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchForm();
  }, [id]);

const handleAction = async (action) => {
    if (!form || !window.confirm(`Are you sure you want to ${action} this form?`)) {
      return;
    }

    setSaving(true);
    setError('');
    try {
      let newTo = Array.isArray(form.to) ? [...form.to] : [form.to];
      if (action === 'forward' && forwardTo && !newTo.includes(forwardTo)) {
        newTo.push(forwardTo);
      }
      
      const formType = form.owner === 'student' ? 'student' : 'faculty';

      // 1. Capture the response from the API call
      const response = await axios.put('http://localhost:3096/updateFormRemarksStatus', {
        formId: form._id || form.id,
        formType,
        remarks,
        to: action === 'forward' ? newTo : undefined,
        status: action === 'forward' ? 'forwarded' : action,
        by: userRole,
      });

      // 2. Use the returned data to update your state
      // This ensures your local state is a perfect match for the database
      setForm(response.data);
      
      if (action !== 'forward') {
        setShowSidePanel(false);
      }

    } catch (err) {
      // You can also improve error handling to be more specific
      const message = err.response?.data?.message || 'Failed to update.';
      setError(message);
    } finally {
      setSaving(false);
    }
};

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>;
  if (error) return <div style={{ padding: 40, textAlign: 'center', color: 'red' }}>{error}</div>;
  if (!form) return null;

  const status = form.status || 'awaiting';
  const statusLabel = statusLabels[status] || status;
  const statusColor = statusColors[status] || '#888';

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', minHeight: '80vh', background: '#f8f9fa', padding: 40 }}>
        {/* Status Bar */}
        <div style={{ width: 16, minHeight: 400, background: statusColor, borderRadius: 8, marginRight: 32, position: 'relative' }}>
          <div style={{ position: 'absolute', top: 20, left: 24, color: statusColor, fontWeight: 'bold', writingMode: 'vertical-rl', textOrientation: 'mixed', fontSize: 18, letterSpacing: 2 }}>
            {statusLabel}
          </div>
        </div>
        {/* Letter Format */}
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px #eee', padding: 40, minWidth: 400, maxWidth: 700, width: '100%', position: 'relative' }}>
          <div style={{ textAlign: 'right', marginBottom: 16 }}>
            <div><b>Date:</b> {form.createdAt ? new Date(form.createdAt).toLocaleString() : ''}</div>
            <div><b>No:</b> {form.formNo || form._id}</div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div>To,</div>
            <div style={{ marginLeft: 32 }}>{Array.isArray(form.to) ? form.to.join(', ') : form.to}</div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div><b>Subject:</b> {form.subject}</div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div>Respected Sir/Madam,</div>
            <div style={{ marginTop: 16, marginLeft: 32 }}>{form.details}</div>
          </div>
          {form.attachment && form.attachment.filename && (
            <div style={{ marginBottom: 16, marginLeft: 32 }}>
              <b>Attachment:</b> {form.attachment.filename}
            </div>
          )}
          <div style={{ marginTop: 32 }}>
            <div><b>Department:</b> {form.department}</div>
            <div><b>Submitted By:</b> {form.submittedBy}</div>
          </div>
          
          {/* Action Button */}
          <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setShowSidePanel(true)}
              style={{
                background: '#3182ce',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                padding: '12px 32px',
                cursor: 'pointer',
                fontWeight: '500',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={e => e.target.style.transform = 'scale(1.02)'}
              onMouseLeave={e => e.target.style.transform = 'scale(1)'}
            >
              Actions
              <span style={{ fontSize: '18px', marginTop: '1px' }}>→</span>
            </button>
          </div>
        </div>
      </div>

      {/* Side Panel */}
      {showSidePanel && (
        <>
          {/* Overlay */}
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 40,
            }}
            onClick={() => setShowSidePanel(false)}
          />
          
          {/* Side Panel Content */}
          <div 
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              width: '400px',
              height: '100vh',
              background: 'white',
              boxShadow: '-2px 0 8px rgba(0,0,0,0.1)',
              padding: '24px',
              zIndex: 50,
              overflowY: 'auto'
            }}
          >
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ 
                  margin: 0, 
                  color: '#374151', 
                  fontSize: '1.2rem',
                }}>⚡ Form Actions</h3>
                <button 
                  onClick={() => setShowSidePanel(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    fontSize: '20px',
                    cursor: 'pointer',
                    padding: '4px',
                    color: '#64748b'
                  }}
                >
                  ×
                </button>
              </div>
              <div style={{ height: '2px', background: '#e5e7eb' }} />
            </div>

            {/* Form Info */}
            <div style={{ 
              background: '#f8fafc',
              borderRadius: 8,
              padding: 16,
              marginBottom: 20,
              border: '1px solid #e2e8f0'
            }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#374151', fontSize: '1rem' }}>
                📋 Form Details
              </h4>
              <div style={{ fontSize: '0.9rem', color: '#6b7280', lineHeight: 1.5 }}>
                <div><strong>Form ID:</strong> #{form.formNo || form._id}</div>
                <div><strong>Subject:</strong> {form.subject}</div>
                <div><strong>Department:</strong> {form.department}</div>
                <div><strong>Status:</strong> 
                  <span style={{ 
                    background: statusColors[form.status?.toLowerCase?.()] || '#888',
                    color: 'white',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    marginLeft: '8px'
                  }}>
                    {form.status || 'awaiting'}
                  </span>
                </div>
                <div><strong>Submitted By:</strong> {form.submittedBy}</div>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#374151', fontSize: '1rem' }}>
                🎯 Quick Actions
              </h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {/* Accept button only for Principal/Manager */}
                {rolePermissions[userRole]?.accept && (
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to accept this form?')) {
                        handleAction('accepted');
                      }
                    }}
                    disabled={saving}
                    style={{
                      background: '#22c55e',
                      color: 'white',
                      border: 'none',
                      borderRadius: 6,
                      padding: '10px 16px',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      cursor: saving ? 'not-allowed' : 'pointer',
                      opacity: saving ? 0.6 : 1
                    }}
                  >
                    ✓ Accept Form
                  </button>
                )}
                {/* Reject button for all allowed roles */}
                {rolePermissions[userRole]?.reject && (
                  <button
                    onClick={() => {
                      if (!remarks.trim()) {
                        alert('Please provide remarks when rejecting a form.');
                        return;
                      }
                      if (window.confirm('Are you sure you want to reject this form?')) {
                        handleAction('rejected');
                      }
                    }}
                    disabled={saving}
                    style={{
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: 6,
                      padding: '10px 16px',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      cursor: saving ? 'not-allowed' : 'pointer',
                      opacity: saving ? 0.6 : 1
                    }}
                  >
                    ✗ Reject Form
                  </button>
                )}
                {/* Request Edit button for all allowed roles */}
                {rolePermissions[userRole]?.requestEdit && (
                  <button
                    onClick={() => {
                      if (!remarks.trim()) {
                        alert('Please provide remarks when requesting edits.');
                        return;
                      }
                      if (window.confirm('Are you sure you want to request edits for this form?')) {
                        handleAction('edit');
                      }
                    }}
                    disabled={saving}
                    style={{
                      background: '#f59e0b',
                      color: 'white',
                      border: 'none',
                      borderRadius: 6,
                      padding: '10px 16px',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      cursor: saving ? 'not-allowed' : 'pointer',
                      opacity: saving ? 0.6 : 1
                    }}
                  >
                    ✏️ Request Edit
                  </button>
                )}
              </div>
            </div>

            {/* Remarks Section */}
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#374151', fontSize: '1rem' }}>
                💬 Remarks
              </h4>
              <textarea
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                placeholder="Add your remarks here..."
                style={{
                  width: '100%',
                  minHeight: 80,
                  padding: 12,
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  fontSize: '0.9rem',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  background: '#f8fafc'
                }}
              />
            </div>

            {/* Forward To Section */}
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#374151', fontSize: '1rem' }}>
                📤 Forward To
              </h4>
              <select
                value={forwardTo}
                onChange={e => setForwardTo(e.target.value)}
                style={{
                  width: '100%',
                  padding: 10,
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  fontSize: '0.9rem',
                  background: '#f8fafc'
                }}
              >
                <option value="">Select person to forward</option>
                {FORWARD_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>

              {forwardTo && (
                <button
                  onClick={() => {
                    if (!remarks) {
                      alert('Please add remarks before forwarding');
                      return;
                    }
                    if (window.confirm(`Are you sure you want to forward this form to ${forwardTo}?`)) {
                      handleAction('forward');
                    }
                  }}
                  disabled={saving || !remarks || !forwardTo}
                  style={{
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    padding: '8px 16px',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    cursor: saving || !remarks || !forwardTo ? 'not-allowed' : 'pointer',
                    opacity: saving || !remarks || !forwardTo ? 0.6 : 1,
                    marginTop: 8,
                    width: '100%'
                  }}
                >
                  📤 Forward Form
                </button>
              )}
            </div>

            {/* Clear/Close Button */}
            <button
              onClick={() => setShowSidePanel(false)}
              style={{
                background: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                padding: '8px 16px',
                fontSize: '0.85rem',
                fontWeight: '600',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              🗑️ Close Panel
            </button>

            {error && (
              <div style={{ 
                marginTop: '12px', 
                padding: '8px', 
                borderRadius: '4px', 
                background: '#fef2f2', 
                color: '#ef4444', 
                fontSize: '0.875rem', 
                textAlign: 'center',
                border: '1px solid #fee2e2' 
              }}>
                {error}
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
} 