import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import './ReceivedForms.css';

export default function ReceivedForms({ previewMode }) {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = jwtDecode(localStorage.getItem('token'));
    const email = token.email;
    const role = token.role;
    axios.get(`http://localhost:3096/getReceivedFormsForUser?email=${encodeURIComponent(email)}&role=${encodeURIComponent(role)}`)
      .then(res => setForms(res.data || []))
      .catch(() => setForms([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;

  const formsToShow = previewMode ? forms.slice(0, 5) : forms;

  return (
    <div className="received-forms-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ margin: 0 }}>Received Forms</h2>
        {previewMode && (
          <button
            className="view-all-btn"
            style={{ background: '#3182ce', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 500 }}
            onClick={() => navigate('/received-forms')}
          >
            View All
          </button>
        )}
      </div>
      <table className="received-forms-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Sender</th>
            <th>Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {formsToShow.map(form => (
            <tr
              key={form._id || form.id}
              className="received-form-row"
              style={{ backgroundColor: '#fff', cursor: 'pointer', color: '#222' }}
              onClick={() => navigate(`/received-forms/${form._id || form.id}`)}
            >
              <td>{form.subject || form.title}</td>
              <td>{form.submittedBy || form.sender}</td>
              <td>{form.createdAt ? new Date(form.createdAt).toLocaleString() : (form.date || '')}</td>
              <td>
                <span className={`status-tag status-tag-${form.status}`}>{form.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 