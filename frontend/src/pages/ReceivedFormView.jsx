import React, { useState } from 'react';
import { useParams } from 'react-router-dom';

// Mock data for demonstration
const mockForms = [
  {
    id: 1,
    title: 'Leave Application',
    sender: 'John Doe',
    date: '2024-06-01',
    status: 'new',
    details: 'Requesting leave for 3 days due to personal reasons.',
    remarks: '',
    signature: '',
  },
  {
    id: 2,
    title: 'Conference Request',
    sender: 'Jane Smith',
    date: '2024-05-28',
    status: 'opened',
    details: 'Requesting permission to attend a conference.',
    remarks: 'Please attach conference details.',
    signature: 'Staff A',
  },
];

const statusLabels = {
  new: 'New',
  opened: 'Opened',
  approved: 'Approved',
  rejected: 'Rejected',
  forwarded: 'Forwarded',
};

const statusColors = {
  new: 'blue',
  opened: 'grey',
  approved: 'green',
  rejected: 'red',
  forwarded: 'orange',
};

export default function ReceivedFormView() {
  const { id } = useParams();
  const userRole = localStorage.getItem('userRole') || 'staff';
  const form = mockForms.find(f => f.id === Number(id)) || mockForms[0];

  const [status, setStatus] = useState(form.status);
  const [remarks, setRemarks] = useState(form.remarks);
  const [signature, setSignature] = useState(form.signature);

  const handleAction = (newStatus) => {
    setStatus(newStatus);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ maxWidth: 600, margin: '2rem auto', background: '#fff', padding: '2rem', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
      <h2>{form.title}</h2>
      <div style={{ marginBottom: 12 }}>
        <span><b>Sender:</b> {form.sender}</span><br />
        <span><b>Date:</b> {form.date}</span><br />
        <span>
          <b>Status:</b> <span style={{ background: statusColors[status], color: '#fff', borderRadius: 6, padding: '2px 10px', fontSize: '0.95em' }}>{statusLabels[status]}</span>
        </span>
      </div>
      <div style={{ marginBottom: 18 }}>
        <b>Details:</b>
        <div style={{ background: '#f7f7f7', padding: 12, borderRadius: 6, marginTop: 4 }}>{form.details}</div>
      </div>
      <div style={{ marginBottom: 18 }}>
        <b>Remarks:</b>
        {userRole === 'staff' ? (
          <textarea
            value={remarks}
            onChange={e => setRemarks(e.target.value)}
            rows={3}
            style={{ width: '100%', marginTop: 4, borderRadius: 4, border: '1px solid #ccc', padding: 8 }}
          />
        ) : (
          <div style={{ background: '#f7f7f7', padding: 8, borderRadius: 4, marginTop: 4, minHeight: 40 }}>
            {remarks || <span style={{ color: '#aaa' }}>No remarks</span>}
          </div>
        )}
      </div>
      <div style={{ marginBottom: 18 }}>
        <b>Staff Signature:</b>
        {userRole === 'staff' ? (
          <input
            type="text"
            value={signature}
            onChange={e => setSignature(e.target.value)}
            placeholder="Sign here"
            style={{ width: '100%', marginTop: 4, borderRadius: 4, border: '1px solid #ccc', padding: 8 }}
          />
        ) : (
          <div style={{ background: '#f7f7f7', padding: 8, borderRadius: 4, marginTop: 4, minHeight: 32 }}>
            {signature || <span style={{ color: '#aaa' }}>No signature</span>}
          </div>
        )}
      </div>
      {userRole === 'staff' && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
          <button onClick={() => handleAction('approved')} style={{ background: '#38a169', color: '#fff', border: 'none', borderRadius: 4, padding: '8px 16px' }}>Approve</button>
          <button onClick={() => handleAction('rejected')} style={{ background: '#e53e3e', color: '#fff', border: 'none', borderRadius: 4, padding: '8px 16px' }}>Reject</button>
          <button onClick={() => handleAction('forwarded')} style={{ background: '#ed8936', color: '#fff', border: 'none', borderRadius: 4, padding: '8px 16px' }}>Forward</button>
        </div>
      )}
      <button onClick={handlePrint} style={{ background: '#3182ce', color: '#fff', border: 'none', borderRadius: 4, padding: '8px 16px' }}>Print PDF</button>
    </div>
  );
} 