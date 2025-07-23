import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
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
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSubmission = async () => {
      setLoading(true);
      setError('');
      try {
        // Try both student and faculty endpoints
        let res = await axios.get(`http://localhost:3096/getSFormsByUser?email=all`);
        let found = (res.data || []).find(f => f._id === id);
        if (!found) {
          res = await axios.get(`http://localhost:3096/getFFormsByUser?email=all`);
          found = (res.data || []).find(f => f._id === id);
        }
        if (!found) throw new Error('Submission not found');
        setSubmission(found);
      } catch (err) {
        setError('Submission not found or failed to load.');
      } finally {
        setLoading(false);
      }
    };
    fetchSubmission();
  }, [id]);

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>;
  if (error) return <div style={{ padding: 40, textAlign: 'center', color: 'red' }}>{error}</div>;
  if (!submission) return null;

  const status = submission.status || 'awaiting';
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
      {/* Letter Format */}
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px #eee', padding: 40, minWidth: 400, maxWidth: 700, width: '100%' }}>
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
      </div>
    </div>
  );
} 