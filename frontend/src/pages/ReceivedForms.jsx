// ===============================
// File: src/pages/ReceivedForms.jsx
// Description: Page listing all received forms (for staff/admin).
// ===============================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ReceivedForms.css';

const mockForms = [
  {
    id: 1,
    title: 'Leave Application',
    sender: 'John Doe',
    date: '2024-06-01',
    status: 'new',
  },
  {
    id: 2,
    title: 'Conference Request',
    sender: 'Jane Smith',
    date: '2024-05-28',
    status: 'opened',
  },
  {
    id: 3,
    title: 'Research Grant',
    sender: 'Alice Brown',
    date: '2024-05-20',
    status: 'approved',
  },
  {
    id: 4,
    title: 'Travel Reimbursement',
    sender: 'Bob Lee',
    date: '2024-05-18',
    status: 'rejected',
  },
  {
    id: 5,
    title: 'Equipment Purchase',
    sender: 'Carol White',
    date: '2024-05-15',
    status: 'forwarded',
  },
  {
    id: 6,
    title: 'Extra Form',
    sender: 'Extra Sender',
    date: '2024-05-10',
    status: 'opened',
  },
];

const statusColors = {
  new: '#3182ce', // blue
  opened: '#a0aec0', // grey
  approved: '#38a169', // green
  rejected: '#e53e3e', // red
  forwarded: '#ed8936', // orange
};

const statusLabels = {
  new: 'New',
  opened: 'Opened',
  approved: 'Approved',
  rejected: 'Rejected',
  forwarded: 'Forwarded',
};

// ReceivedForms: Main component for listing received forms
export default function ReceivedForms({ previewMode }) {
  const [forms] = useState(mockForms);
  const navigate = useNavigate();
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
              key={form.id}
              className="received-form-row"
              style={{ backgroundColor: statusColors[form.status], cursor: 'pointer', color: '#fff' }}
              onClick={() => navigate(`/received-forms/${form.id}`)}
            >
              <td>{form.title}</td>
              <td>{form.sender}</td>
              <td>{form.date}</td>
              <td>
                <span className={`status-tag status-tag-${form.status}`}>
                  {statusLabels[form.status]}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 