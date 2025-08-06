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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, fontSize: '1.5rem' }}>Form Actions</h3>
              <button 
                onClick={() => setShowSidePanel(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '4px',
                  color: '#666'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                Add Remarks
              </label>
              <textarea
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                placeholder="Enter your remarks..."
                style={{
                  width: '100%',
                  minHeight: '120px',
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  resize: 'vertical',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                Forward To
              </label>
              <select
                value={forwardTo}
                onChange={e => setForwardTo(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  fontSize: '14px',
                  background: 'white'
                }}
              >
                <option value="">Select recipient...</option>
                {FORWARD_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {form.status !== 'accepted' && (
              <button
                onClick={() => {
                  const reason = prompt('Reason for acceptance (optional):');
                  if (reason !== null) { // User didn't cancel
                    setRemarks(reason || 'Accepted by ' + userRole);
                    handleAction('accepted');
                  }
                }}
                disabled={saving}
                style={{
                  width: '100%',
                  padding: '12px',
                  marginBottom: '12px',
                  background: saving ? '#9ca3af' : '#22c55e',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
              >
                {saving ? 'Saving...' : '✓ Accept Form'}
              </button>
            )}
            
            {form.status !== 'rejected' && (
              <button
                onClick={() => {
                  const reason = prompt('Reason for rejection (optional):');
                  if (reason !== null) { // User didn't cancel
                    setRemarks(reason || 'Rejected by ' + userRole);
                    handleAction('rejected');
                  }
                }}
                disabled={saving}
                style={{
                  width: '100%',
                  padding: '12px',
                  marginBottom: '24px',
                  background: saving ? '#9ca3af' : '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
              >
                {saving ? 'Saving...' : '✗ Reject Form'}
              </button>
            )}

            <button
              onClick={() => handleAction('forward')}
              disabled={saving || !remarks || !forwardTo}
              style={{
                width: '100%',
                padding: '12px',
                background: (saving || !remarks || !forwardTo) ? '#9ca3af' : '#3182ce',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: (saving || !remarks || !forwardTo) ? 'not-allowed' : 'pointer',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
            >
              {saving ? 'Saving...' : 'Save & Forward'}
            </button>
            {error && (
              <div style={{ marginTop: '12px', color: '#ef4444', fontSize: '14px', textAlign: 'center' }}>
                {error}
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
} 