import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from "jwt-decode";
import AttachmentViewer from '../components/AttachmentViewer';
const statusLabels = {
  awaiting: 'Awaiting',
  forwarded: 'Forwarded',
  accepted: 'Accepted',
  rejected: 'Rejected',
  approved: 'Approved',
  edit: 'Edit Requested',
};
const statusColors = {
  awaiting: '#fbbf24', // yellow
  forwarded: '#3b82f6', // blue
  accepted: '#22c55e', // green
  rejected: '#ef4444', // red
  approved: '#22c55e', // green
  edit: '#f59e0b', // orange
};

export default function SubmissionView() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Form fields for editing
  const [formData, setFormData] = useState({
    to: '',
    subject: '',
    details: '',
    attachment: null
  });

  useEffect(() => {
    // Get current user from token
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setCurrentUser(decoded);
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }

    const fetchSubmission = async () => {
      setLoading(true);
      setError('');
      try {
        let res = await axios.get(`http://localhost:3096/getSFormById/${id}`);
        console.log('Student form data:', res.data);
        console.log('Attachment data:', res.data.attachment);
        setSubmission(res.data);
        // Initialize form data for editing
        setFormData({
          to: Array.isArray(res.data.to) ? res.data.to.join(', ') : res.data.to,
          subject: res.data.subject || '',
          details: res.data.details || '',
          attachment: res.data.attachment || null
        });
      } catch (err1) {
        try {
          let res = await axios.get(`http://localhost:3096/getFFormById/${id}`);
          console.log('Faculty form data:', res.data);
          console.log('Attachment data:', res.data.attachment);
          setSubmission(res.data);
          // Initialize form data for editing
          setFormData({
            to: Array.isArray(res.data.to) ? res.data.to.join(', ') : res.data.to,
            subject: res.data.subject || '',
            details: res.data.details || '',
            attachment: res.data.attachment || null
          });
        } catch (err2) {
          setError('Submission not found or failed to load.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchSubmission();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        attachment: file
      }));
    }
  };

  const handleSave = async (resubmit = false) => {
    if (!submission || !currentUser) return;
    
    // Validate form fields
    if (!formData.to.trim() || !formData.subject.trim() || !formData.details.trim()) {
      setError('Please fill in all required fields (To, Subject, and Details).');
      return;
    }
    
    setSaving(true);
    setError('');
    
    try {
      // Determine form type based on the form structure
      // Student forms have 'div' and 'year' fields, faculty forms don't
      const formType = submission.div || submission.year ? 'student' : 'faculty';
      
      // Prepare the data to send
      const updateData = {
        formId: submission._id || submission.id,
        formType,
        submittedBy: currentUser.email,
        to: formData.to,
        subject: formData.subject,
        details: formData.details,
        resubmit: resubmit
      };

      // If there's a new file, handle it
      if (formData.attachment && formData.attachment instanceof File) {
        const formDataFile = new FormData();
        formDataFile.append('attachment', formData.attachment);
        // You might need to handle file upload separately or include it in the update
        updateData.attachment = formData.attachment;
      }

      const response = await axios.put('http://localhost:3096/updateFormContent', updateData);
      
      // Update the local state with the response
      setSubmission(response.data);
      setIsEditing(false);
      
      if (resubmit) {
        alert('Form resubmitted successfully! It will be reviewed again.');
      } else {
        alert('Form updated successfully!');
      }
      
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update form.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form data to original values
    if (submission) {
      setFormData({
        to: Array.isArray(submission.to) ? submission.to.join(', ') : submission.to,
        subject: submission.subject || '',
        details: submission.details || '',
        attachment: submission.attachment || null
      });
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>;
  if (error) return <div style={{ padding: 40, textAlign: 'center', color: 'red' }}>{error}</div>;
  if (!submission) return null;

  const status = submission.status || 'awaiting';
  const statusLabel = statusLabels[status] || status;
  const statusColor = statusColors[status] || '#888';

  // Determine if this is a received form view (e.g., via location.state)
  const isReceivedView = location.state?.fromReceived || false;

  // Check if current user can edit this form
  const canEdit = currentUser && 
                  submission.status === 'edit' && 
                  submission.submittedBy === currentUser.email;

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
        {/* Edit/View Controls */}
        {canEdit && (
          <div style={{ marginBottom: 20, display: 'flex', gap: 10 }}>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                style={{ 
                  background: '#f59e0b', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: 4, 
                  padding: '8px 16px',
                  cursor: 'pointer'
                }}
              >
                Edit Form
              </button>
            ) : (
              <>
                <button
                  onClick={() => handleSave(false)}
                  disabled={saving}
                  style={{ 
                    background: '#22c55e', 
                    color: '#fff', 
                    border: 'none', 
                    borderRadius: 4, 
                    padding: '8px 16px',
                    cursor: 'pointer'
                  }}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => handleSave(true)}
                  disabled={saving}
                  style={{ 
                    background: '#3b82f6', 
                    color: '#fff', 
                    border: 'none', 
                    borderRadius: 4, 
                    padding: '8px 16px',
                    cursor: 'pointer'
                  }}
                >
                  {saving ? 'Saving...' : 'Save & Resubmit'}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  style={{ 
                    background: '#6b7280', 
                    color: '#fff', 
                    border: 'none', 
                    borderRadius: 4, 
                    padding: '8px 16px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        )}

        <div style={{ textAlign: 'right', marginBottom: 16 }}>
          <div><b>Date:</b> {submission.createdAt ? new Date(submission.createdAt).toLocaleString() : ''}</div>
          <div><b>No:</b> {submission.formNo || submission._id}</div>
        </div>
        
        <div style={{ marginBottom: 16 }}>
          <div>To,</div>
          {isEditing ? (
            <input
              type="text"
              name="to"
              value={formData.to}
              onChange={handleInputChange}
              style={{ marginLeft: 32, width: 'calc(100% - 32px)', padding: '8px', border: '1px solid #ddd', borderRadius: 4 }}
              placeholder="Enter recipients"
            />
          ) : (
            <div style={{ marginLeft: 32 }}>{Array.isArray(submission.to) ? submission.to.join(', ') : submission.to}</div>
          )}
        </div>
        
        <div style={{ marginBottom: 16 }}>
          {isEditing ? (
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleInputChange}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: 4 }}
              placeholder="Enter subject"
            />
          ) : (
            <div><b>Subject:</b> {submission.subject}</div>
          )}
        </div>
        
        <div style={{ marginBottom: 16 }}>
          <div>Respected Sir/Madam,</div>
          {isEditing ? (
            <textarea
              name="details"
              value={formData.details}
              onChange={handleInputChange}
              style={{ 
                marginTop: 16, 
                marginLeft: 32, 
                width: 'calc(100% - 32px)', 
                padding: '8px', 
                border: '1px solid #ddd', 
                borderRadius: 4,
                minHeight: '120px',
                resize: 'vertical'
              }}
              placeholder="Enter form details"
            />
          ) : (
            <div style={{ marginTop: 16, marginLeft: 32 }}>{submission.details}</div>
          )}
        </div>
        
        {isEditing ? (
          <div style={{ marginBottom: 16, marginLeft: 32 }}>
            <b>Attachment:</b>
            <input
              type="file"
              onChange={handleFileChange}
              style={{ marginLeft: 8 }}
            />
            {formData.attachment && formData.attachment.filename && (
              <div style={{ marginTop: 4, fontSize: '0.9em', color: '#666' }}>
                Current: {formData.attachment.filename}
              </div>
            )}
          </div>
        ) : (
          submission.attachment && submission.attachment.filename && (
            <div style={{ marginBottom: 16, marginLeft: 32 }}>
              <b>Attachment:</b>
              <AttachmentViewer attachment={submission.attachment} />
            </div>
          )
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

        {/* Error message */}
        {error && (
          <div style={{ marginTop: 16, padding: 12, background: '#fee2e2', color: '#991b1b', borderRadius: 4, border: '1px solid #fecaca' }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
} 