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

const handleSave = async () => {
    if (!form) return;
    setSaving(true);
    setError('');
    try {
      let newTo = Array.isArray(form.to) ? [...form.to] : [form.to];
      if (forwardTo && !newTo.includes(forwardTo)) {
        newTo.push(forwardTo);
      }
      
      const formType = form.owner === 'student' ? 'student' : 'faculty';

      // 1. Capture the response from the API call
      const response = await axios.put('http://localhost:3096/updateFormRemarksStatus', {
        formId: form._id || form.id,
        formType,
        remarks,
        to: newTo,
        status: 'forwarded',
        by: userRole,
      });

      // 2. Use the returned data to update your state
      // This ensures your local state is a perfect match for the database
      setForm(response.data); 

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
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', minHeight: '80vh', background: '#f8f9fa', padding: 40 }}>
      {/* Status Bar */}
      <div style={{ width: 16, minHeight: 400, background: statusColor, borderRadius: 8, marginRight: 32, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 20, left: 24, color: statusColor, fontWeight: 'bold', writingMode: 'vertical-rl', textOrientation: 'mixed', fontSize: 18, letterSpacing: 2 }}>
          {statusLabel}
        </div>
      </div>
      {/* Letter Format + New Features */}
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px #eee', padding: 40, minWidth: 400, maxWidth: 700, width: '100%' }}>
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
        {/* New Features: Remarks and Forward To */}
        <div style={{ marginTop: 32, padding: 16, background: '#f8f9fa', borderRadius: 8, border: '1px solid #eee' }}>
          <b>Remarks:</b>
          <textarea
            value={remarks}
            onChange={e => setRemarks(e.target.value)}
            rows={3}
            style={{ width: '100%', marginTop: 8, borderRadius: 4, border: '1px solid #ccc', padding: 8 }}
          />
          <div style={{ marginTop: 18 }}>
            <b>Forward To:</b>
            <select
              value={forwardTo}
              onChange={e => setForwardTo(e.target.value)}
              style={{ width: '100%', marginTop: 8, borderRadius: 4, border: '1px solid #ccc', padding: 8 }}
            >
              <option value="">Select person to forward</option>
              {FORWARD_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ background: '#3182ce', color: '#fff', border: 'none', borderRadius: 4, padding: '8px 16px', marginTop: 18 }}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          {error && <span style={{ color: 'red', marginLeft: 12 }}>{error}</span>}
        </div>
      </div>
    </div>
  );
} 