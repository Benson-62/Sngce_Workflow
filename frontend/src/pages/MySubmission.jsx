                  import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

function MySubmission() {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Load received messages from localStorage
  const [receivedMessages, setReceivedMessages] = useState(
    JSON.parse(localStorage.getItem('receivedMessages') || '[]')
  );
  // Load remarks/actions from localStorage (object keyed by message id)
  const [remarks, setRemarks] = useState(
    JSON.parse(localStorage.getItem('receivedRemarks') || '{}')
  );

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    let decoded;
    try {
      decoded = jwtDecode(token);
    } catch (err) {
      setError('Invalid token');
      setLoading(false);
      return;
    }
    const email = decoded.email;
    const role = decoded.role;
    const fetchSubmissions = async () => {
      try {
        let url = '';
        if (role === 'Student' || role === 'student') {
          url = `http://localhost:3096/getSFormsByUser?email=${encodeURIComponent(email)}`;
        } else {
          url = `http://localhost:3096/getFFormsByUser?email=${encodeURIComponent(email)}`;
        }
        const res = await axios.get(url);
        setSubmissions(res.data || []);
      } catch (err) {
        setError('Failed to fetch submissions');
      } finally {
        setLoading(false);
      }
    };
    fetchSubmissions();
  }, [navigate]);

  // Handle input changes for remarks and actions
  const handleInputChange = (id, field, value) => {
    setRemarks(prev => {
      const updated = { ...prev, [id]: { ...prev[id], [field]: value } };
      return updated;
    });
  };

  // Save remarks/actions to localStorage
  const handleSave = (id) => {
    localStorage.setItem('receivedRemarks', JSON.stringify(remarks));
    alert('Saved!');
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Loading submissions...</div>;
  }
  if (error) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'red' }}>{error}</div>;
  }
  if (!submissions.length && !receivedMessages.length) {
    return <div style={{ padding: 40, textAlign: 'center' }}>No submissions or received messages found.</div>;
  }

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', background: '#fff', borderRadius: 10, boxShadow: '0 2px 10px #eee', padding: 32 }}>
      <h2 style={{ textAlign: 'center', marginBottom: 32 }}>My Submissions</h2>
      {submissions.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 40 }}>
          <thead>
            <tr style={{ background: '#f8f9fa' }}>
              <th style={{ padding: 12, borderBottom: '1px solid #eee' }}>Subject</th>
              <th style={{ padding: 12, borderBottom: '1px solid #eee' }}>Department</th>
              <th style={{ padding: 12, borderBottom: '1px solid #eee' }}>Date</th>
              <th style={{ padding: 12, borderBottom: '1px solid #eee' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map(sub => (
              <tr key={sub._id}>
                <td style={{ padding: 12, borderBottom: '1px solid #eee' }}>{sub.subject}</td>
                <td style={{ padding: 12, borderBottom: '1px solid #eee' }}>{sub.department}</td>
                <td style={{ padding: 12, borderBottom: '1px solid #eee' }}>{sub.createdAt ? new Date(sub.createdAt).toLocaleString() : (sub.date ? new Date(sub.date).toLocaleDateString() : '')}</td>
                <td style={{ padding: 12, borderBottom: '1px solid #eee' }}>
                  <button onClick={() => alert('View/Print not implemented in demo')}>View/Print</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2 style={{ textAlign: 'center', marginBottom: 32 }}>Received Messages</h2>
      {receivedMessages.length === 0 ? (
        <div style={{ textAlign: 'center', marginBottom: 32 }}>No received messages found.</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8f9fa' }}>
              <th style={{ padding: 12, borderBottom: '1px solid #eee' }}>From</th>
              <th style={{ padding: 12, borderBottom: '1px solid #eee' }}>Subject</th>
              <th style={{ padding: 12, borderBottom: '1px solid #eee' }}>Date</th>
              <th style={{ padding: 12, borderBottom: '1px solid #eee' }}>Remarks</th>
              <th style={{ padding: 12, borderBottom: '1px solid #eee' }}>Action Taken</th>
              <th style={{ padding: 12, borderBottom: '1px solid #eee' }}>Save</th>
            </tr>
          </thead>
          <tbody>
            {receivedMessages.map(msg => (
              <tr key={msg.id}>
                <td style={{ padding: 12, borderBottom: '1px solid #eee' }}>{msg.from || '-'}</td>
                <td style={{ padding: 12, borderBottom: '1px solid #eee' }}>{msg.subject}</td>
                <td style={{ padding: 12, borderBottom: '1px solid #eee' }}>{msg.date}</td>
                <td style={{ padding: 12, borderBottom: '1px solid #eee' }}>
                  <input
                    type="text"
                    value={remarks[msg.id]?.remarks || ''}
                    onChange={e => handleInputChange(msg.id, 'remarks', e.target.value)}
                    style={{ width: '100%' }}
                  />
                </td>
                <td style={{ padding: 12, borderBottom: '1px solid #eee' }}>
                  <input
                    type="text"
                    value={remarks[msg.id]?.action || ''}
                    onChange={e => handleInputChange(msg.id, 'action', e.target.value)}
                    style={{ width: '100%' }}
                  />
                </td>
                <td style={{ padding: 12, borderBottom: '1px solid #eee' }}>
                  <button onClick={() => handleSave(msg.id)}>Save</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default MySubmission; 