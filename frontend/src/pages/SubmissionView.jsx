import React, { useEffect, useState, useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { jwtDecode } from "jwt-decode";
import axios from 'axios';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const statusLabels = {
  awaiting: 'Awaiting',
  forwarded: 'Forwarded',
  accepted: 'Accepted',
  rejected: 'Rejected',
  approved: 'Approved',
  not_approved: 'Not Approved',
  cancelled: 'Cancelled',
};
const statusColors = {
  awaiting: '#fbbf24', // yellow
  forwarded: '#3b82f6', // blue
  accepted: '#22c55e', // green
  rejected: '#ef4444', // red
  approved: '#22c55e', // green
  edit: '#f59e0b', // orange - needs editing/revision
  not_approved: '#f97316', // orange
  cancelled: '#6b7280', // gray
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

export default function SubmissionView() {
  const { id } = useParams();
  const location = useLocation();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());
  const letterRef = useRef(null);
  
  // Form action states
  const [remarks, setRemarks] = useState('');
  const [forwardTo, setForwardTo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Check if current user can perform actions (receiver only, not sender)
  const canPerformActions = currentUser && 
    submission.submittedBy !== currentUser.email && 
    (Array.isArray(submission.to) ? submission.to.includes(currentUser.role) : submission.to === currentUser.role);

  // Handle form actions
  const handleFormAction = async (action, actionRemarks = '') => {
    if (!canPerformActions) {
      alert('You are not authorized to perform this action.');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = jwtDecode(localStorage.getItem('token'));
      const backendFormType = submission.owner === 'staff' ? 'faculty' : submission.owner;
      
      await axios.put('http://localhost:3096/updateFormRemarksStatus', {
        formId: submission._id,
        formType: backendFormType,
        status: action,
        remarks: actionRemarks || remarks,
        forwardTo: forwardTo || undefined
      });
      
      // Refresh the submission data
      const fetchSubmission = async () => {
        try {
          let res = await axios.get(`http://localhost:3096/getSFormById/${id}`);
          setSubmission(res.data);
        } catch (err1) {
          try {
            let res = await axios.get(`http://localhost:3096/getFFormById/${id}`);
            setSubmission(res.data);
          } catch (err2) {
            console.error('Failed to refresh submission');
          }
        }
      };
      await fetchSubmission();
      
      // Reset form
      setRemarks('');
      setForwardTo('');
      alert(`Form ${action} successfully!`);
      
    } catch (error) {
      console.error('Error performing action:', error);
      alert('Failed to perform action. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle accept action
  const handleAccept = () => {
    if (window.confirm('Are you sure you want to accept this form?')) {
      handleFormAction('accepted', remarks);
    }
  };

  // Handle reject action
  const handleReject = () => {
    if (!remarks.trim()) {
      alert('Please provide remarks when rejecting a form.');
      return;
    }
    if (window.confirm('Are you sure you want to reject this form?')) {
      handleFormAction('rejected', remarks);
    }
  };

  // Handle request edit action
  const handleRequestEdit = () => {
    if (!remarks.trim()) {
      alert('Please provide remarks when requesting edits.');
      return;
    }
    if (window.confirm('Are you sure you want to request edits for this form?')) {
      handleFormAction('edit', remarks);
    }
  };

  // Handle forward action
  const handleForward = () => {
    if (!forwardTo) {
      alert('Please select someone to forward to.');
      return;
    }
    if (window.confirm(`Are you sure you want to forward this form to ${forwardTo}?`)) {
      handleFormAction('forwarded', remarks);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 14;

      if (letterRef.current) {
        const canvas = await html2canvas(letterRef.current, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pageWidth - margin * 2;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        doc.addImage(imgData, 'PNG', margin, margin, imgWidth, Math.min(imgHeight, pageHeight - margin * 2));
      }

      // Add history page
      doc.addPage();
      let y = margin;
      doc.setFontSize(16);
      doc.text('Form Roadmap & Remarks', margin, y);
      y += 8;
      doc.setDrawColor(200);
      doc.line(margin, y, pageWidth - margin, y);
      y += 8;
      doc.setFontSize(12);

      const lines = [];
      lines.push(`Form: #${submission.formNo || submission._id}`);
      lines.push(`Subject: ${submission.subject}`);
      lines.push(`Department: ${submission.department}`);
      lines.push(`Submitted By: ${submission.submittedBy}`);
      lines.push(`Status: ${submission.status}`);
      lines.push('');
      lines.push('History:');
      (submission.history || []).forEach((h, idx) => {
        const ts = h.timestamp ? new Date(h.timestamp).toLocaleString() : '';
        const header = `${idx + 1}. [${ts}] ${h.by || 'system'} - ${h.action || ''}`;
        lines.push(header);
        if (h.remarks) lines.push(`   Remarks: ${h.remarks}`);
        lines.push('');
      });

      const content = doc.splitTextToSize(lines.join('\n'), pageWidth - margin * 2);
      content.forEach((line) => {
        if (y > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
        doc.text(line, margin, y);
        y += 6;
      });

      doc.save(`form_${submission.formNo || submission._id}_roadmap.pdf`);
    } catch (e) {
      console.error(e);
      alert('Failed to generate PDF');
    }
  };

  const handleDownloadAttachment = (attachment) => {
    let u8arr;
    if (attachment.file.type === 'Buffer' && attachment.file.data) {
      u8arr = new Uint8Array(attachment.file.data);
    } else {
      const binaryString = window.atob(attachment.file);
      u8arr = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        u8arr[i] = binaryString.charCodeAt(i);
      }
    }
    const blob = new Blob([u8arr], { type: attachment.mimetype });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = attachment.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div />
          {(currentUser && ['Principal','principal','HOD','hod','FacultyAdvisor','facultyadvisor'].includes(currentUser.role)) && (
            <button
              onClick={handleDownloadPdf}
              style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 12px', fontWeight: 600 }}
            >
              ⬇️ Download PDF
            </button>
          )}
        </div>
        <div style={{ textAlign: 'right', marginBottom: 16 }}>
          <div><b>Date:</b> {submission.createdAt ? new Date(submission.createdAt).toLocaleString() : ''}</div>
          <div><b>No:</b> {submission.formNo || submission._id}</div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <div>To,</div>
          <div style={{ marginLeft: 32 }}>{Array.isArray(submission.to) ? submission.to.join(', ') : submission.to}</div>
        </div>
        <div style={{ marginBottom: 16 }}>
          {submission.category && <div><b>Category:</b> {submission.category}</div>}
          <div><b>Subject:</b> {submission.subject}</div>
          {submission.subjectElaboration && (
            <div><b>Elaboration:</b> {submission.subjectElaboration}</div>
          )}
        </div>
        <div style={{ marginBottom: 16 }} ref={letterRef}>
          <div>Respected Sir/Madam,</div>
          <div style={{ marginTop: 16, marginLeft: 32 }}>{submission.details}</div>
        </div>
        {submission.attachments && submission.attachments.length > 0 ? (
          <div style={{ marginBottom: 16, marginLeft: 32 }}>
            <b>Attachments:</b>
            <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
              {submission.attachments.map((att, idx) => (
                <li key={idx} style={{ marginBottom: 8 }}>
                  {att.filename}
                  <button
                    onClick={() => handleDownloadAttachment(att)}
                    style={{ marginLeft: 12, background: '#e5e7eb', border: '1px solid #d1d5db', borderRadius: 4, padding: '4px 8px', cursor: 'pointer' }}
                  >
                    Download
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : submission.attachment && submission.attachment.filename && (
          <div style={{ marginBottom: 16, marginLeft: 32 }}>
            <b>Attachment:</b> {submission.attachment.filename}
            <button
              onClick={() => handleDownloadAttachment(submission.attachment)}
              style={{ marginLeft: 12, background: '#e5e7eb', border: '1px solid #d1d5db', borderRadius: 4, padding: '4px 8px', cursor: 'pointer' }}
            >
              Download
            </button>
          </div>
        )}
        <div style={{ marginTop: 32 }}>
          <div><b>Department:</b> {submission.department}</div>
          <div><b>Submitted By:</b> {submission.submittedBy}</div>
        </div>
        
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
          
          {/* Real-time Updates Info
          <div style={{ 
            background: '#f0f9ff',
            borderRadius: 8,
            padding: 12,
            border: '1px solid #0ea5e9',
            marginBottom: 12
          }}> */}
            {/* <div style={{ fontSize: '0.85rem', color: '#0369a1' }}>
              <div style={{ fontWeight: 'bold', marginBottom: 4 }}>🔄 Live Updates</div>
              <div style={{ fontSize: '0.8rem' }}>
                Last updated: {new Date(lastUpdateTime).toLocaleTimeString()}
              </div>
              <div style={{ fontSize: '0.75rem', marginTop: 4, fontStyle: 'italic' }}>
                Auto-refresh every 15 seconds
              </div>
            </div> */}
          {/* </div> */}

          {/* Submitter Actions */}
          {submission.submittedBy === currentUser?.email && (
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#374151', fontSize: '1rem' }}>
                👤 Submitter Actions
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {status === 'awaiting' && (
                  <button
                    onClick={async () => {
                      if (window.confirm('Are you sure you want to cancel this submission?')) {
                        handleFormAction('cancelled', 'Cancelled by submitter');
                      }
                    }}
                    disabled={isSubmitting}
                    style={{
                      background: '#6b7280', color: 'white', border: 'none', borderRadius: 6,
                      padding: '10px 16px', fontSize: '0.9rem', fontWeight: '600', cursor: isSubmitting ? 'not-allowed' : 'pointer'
                    }}
                  >
                    🚫 Cancel Form
                  </button>
                )}
                {['awaiting', 'forwarded', 'edit'].includes(status) && (
                  <button
                    onClick={async () => {
                      setIsSubmitting(true);
                      try {
                        const backendFormType = submission.owner === 'staff' ? 'faculty' : submission.owner;
                        await axios.post('http://localhost:3096/sendReminder', {
                          formId: submission._id,
                          formType: backendFormType,
                          submitterEmail: currentUser.email,
                          currentHandlerRoles: Array.isArray(submission.to) ? submission.to : [submission.to],
                          department: submission.department
                        });
                        alert('Reminders sent successfully!');
                      } catch (err) {
                        alert('Failed to send reminders.');
                      } finally {
                        setIsSubmitting(false);
                      }
                    }}
                    disabled={isSubmitting}
                    style={{
                      background: '#8b5cf6', color: 'white', border: 'none', borderRadius: 6,
                      padding: '10px 16px', fontSize: '0.9rem', fontWeight: '600', cursor: isSubmitting ? 'not-allowed' : 'pointer'
                    }}
                  >
                    🔔 Send Reminder
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Form Actions - Only show for receivers */}
          {canPerformActions && (
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#374151', fontSize: '1rem' }}>
                ⚡ Quick Actions
              </h4>
              
              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {/* Accept button only for Principal/Manager */}
                {rolePermissions[currentUser?.role]?.accept && (
                  <button
                    onClick={handleAccept}
                    disabled={isSubmitting}
                    style={{
                      background: '#22c55e',
                      color: 'white',
                      border: 'none',
                      borderRadius: 6,
                      padding: '10px 16px',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      opacity: isSubmitting ? 0.6 : 1
                    }}
                  >
                    ✓ Accept Form
                  </button>
                )}
                
                {/* Reject button for all allowed roles */}
                {rolePermissions[currentUser?.role]?.reject && (
                  <button
                    onClick={handleReject}
                    disabled={isSubmitting}
                    style={{
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: 6,
                      padding: '10px 16px',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      opacity: isSubmitting ? 0.6 : 1
                    }}
                  >
                    ✗ Reject Form
                  </button>
                )}
                
                {/* Request Edit button for all allowed roles */}
                {rolePermissions[currentUser?.role]?.requestEdit && (
                  <button
                    onClick={handleRequestEdit}
                    disabled={isSubmitting}
                    style={{
                      background: '#f59e0b',
                      color: 'white',
                      border: 'none',
                      borderRadius: 6,
                      padding: '10px 16px',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      opacity: isSubmitting ? 0.6 : 1
                    }}
                  >
                    ✏️ Request Edit
                  </button>
                )}
                
                {/* Not Approved button for acceptable roles */}
                {rolePermissions[currentUser?.role]?.reject && (
                  <button
                    onClick={() => {
                      if (!remarks.trim()) { alert('Please provide remarks when marking as Not Approved.'); return; }
                      if (window.confirm('Are you sure you want to mark this as Not Approved?')) { handleFormAction('not_approved', remarks); }
                    }}
                    disabled={isSubmitting}
                    style={{ background: '#f97316', color: 'white', border: 'none', borderRadius: 6, padding: '10px 16px', fontSize: '0.9rem', fontWeight: '600', cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.6 : 1 }}
                  >
                    ⚠️ Not Approved
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Remarks Section */}
          {canPerformActions && (
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#374151', fontSize: '1rem' }}>
                💬 Remarks
              </h4>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Add your remarks here..."
                style={{
                  width: '100%',
                  minHeight: 80,
                  padding: 12,
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  fontSize: '0.9rem',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />
            </div>
          )}

          {/* Forward To Section */}
          {canPerformActions && (
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#374151', fontSize: '1rem' }}>
                📤 Forward To
              </h4>
              <select
                value={forwardTo}
                onChange={(e) => setForwardTo(e.target.value)}
                style={{
                  width: '100%',
                  padding: 10,
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  fontSize: '0.9rem',
                  background: 'white'
                }}
              >
                <option value="">Select person to forward</option>
                <option value="FacultyAdvisor">Faculty Advisor</option>
                <option value="HOD">HOD</option>
                <option value="Principal">Principal</option>
                <option value="Manager">Manager</option>
                <option value="Committee">Committee</option>
                <option value="Secretary">Secretary</option>
              </select>
              
              {forwardTo && (
                <button
                  onClick={handleForward}
                  disabled={isSubmitting}
                  style={{
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    padding: '8px 16px',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    opacity: isSubmitting ? 0.6 : 1,
                    marginTop: 8,
                    width: '100%'
                  }}
                >
                  📤 Forward Form
                </button>
              )}
            </div>
          )}

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