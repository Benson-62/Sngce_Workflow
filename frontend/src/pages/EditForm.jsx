// frontend/src/pages/EditForm.jsx
import React, { useState, useEffect, useRef } from 'react';
import './NewSubmission.css';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Checkbox from '@mui/material/Checkbox';
import { CheckBoxOutlineBlank, CheckBox } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import AttachmentViewer from '../components/AttachmentViewer';

const initialStateStudent = {
  subject: '',
  department: '',
  to: ['FacultyAdvisor'],
  toOthers: '',
  purpose: [],
  purposeOthers: '',
  details: '',
  remarks: '',
};

const initialStateStaff = {
  subject: '',
  department: '',
  to: [],
  toOthers: '',
  purpose: [],
  purposeOthers: '',
  details: '',
  remarks: '',
  actions: [],
};

const TO_OPTIONS_STAFF = [
  { label: 'Head of Department (HoD)', value: 'HOD' },
  { label: 'Principal', value: 'Principal' },
  { label: 'Manager', value: 'Manager' },
  { label: 'Committee Convenor', value: 'Committee' },
  { label: 'Secretars', value: 'Secretars' },
];

const TO_OPTIONS_STUDENT = [
  { label: 'Faculty Advisor', value: 'FacultyAdvisor' },
  { label: 'Head of Department (HoD)', value: 'HOD' },
  { label: 'Principal', value: 'Principal' },
  { label: 'Manager', value: 'Manager' },
];

const PURPOSE_OPTIONS = [
  { label: 'Approval for event / activity', value: 'event' },
  { label: 'Advance payment request', value: 'advance' },
  { label: 'Final payment settlement', value: 'final' },
  { label: 'Resource / budget allocation', value: 'resource' },
];

const ACTION_OPTIONS = [
  { label: 'Forwarded to higher authority with remarks', value: 'forwarded' },
  { label: 'Returned to lower level with remarks', value: 'returned-lower' },
  { label: 'Returned to originator with comments', value: 'returned-originator' },
  { label: 'Approved for Advance Payment', value: 'approved-advance' },
  { label: 'Settlement of Payment', value: 'settlement' },
];

// Department options for dropdown
const DEPARTMENT_OPTIONS = [
  { name: 'Computer Science and Engineering', short: 'CSE' },
  { name: 'Naval Architect and Ship Building', short: 'NASB' },
  { name: 'Electronics and Communication', short: 'ECE' },
  { name: 'Electrical and Electronics Engineering', short: 'EEE' },
  { name: 'Mechanical Engineering', short: 'ME' },
  { name: 'Civil Engineering', short: 'CE' },
  { name: 'Artificial Intelligence', short: 'AI' },
  { name: 'Cyber Security', short: 'CS' },
  { name: 'Master of Computer Applications', short: 'MCA' }
];

function EditForm() {
  const { id } = useParams();
  const [userRole, setUserRole] = useState();
  const [formStudent, setFormStudent] = useState({
    ...initialStateStudent,
    subject: '',
  });
  const [formStaff, setFormStaff] = useState({
    ...initialStateStaff,
    subject: '',
  });
  const [originalForm, setOriginalForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const today = new Date().toISOString().slice(0, 10);
  const submissionNo = '001/2025';
  const formRef = useRef();
  const printLetterRef = useRef();
  const [showPrintView, setShowPrintView] = useState(false);
  const [attachmentStudent, setAttachmentStudent] = useState(null);
  const [attachmentStaff, setAttachmentStaff] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = jwtDecode(localStorage.getItem('token'));
    if (!token) {
      navigate('/login');
      return;
    }
    try {
      setUserRole(token.role);
    } catch (err) {
      console.error("Invalid token");
      navigate('/login');
    }
  }, [navigate]);

  // Fetch the form data to edit
  useEffect(() => {
    const fetchForm = async () => {
      setLoading(true);
      setError('');
      try {
        let res = await axios.get(`http://localhost:3096/getSFormById/${id}`);
        setOriginalForm(res.data);
        populateFormData(res.data, 'student');
      } catch (err1) {
        try {
          let res = await axios.get(`http://localhost:3096/getFFormById/${id}`);
          setOriginalForm(res.data);
          populateFormData(res.data, 'faculty');
        } catch (err2) {
          setError('Form not found or failed to load.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchForm();
  }, [id]);

  const populateFormData = (formData, formType) => {
    if (formType === 'student') {
      setFormStudent({
        subject: formData.subject || '',
        department: formData.department || '',
        to: Array.isArray(formData.to) ? formData.to : [formData.to],
        toOthers: formData.others || '',
        purpose: [],
        purposeOthers: '',
        details: formData.details || '',
        remarks: '',
      });
      if (formData.attachment) {
        setAttachmentStudent({
          name: formData.attachment.filename,
          type: formData.attachment.mimetype,
          data: formData.attachment.file
        });
      }
    } else {
      setFormStaff({
        subject: formData.subject || '',
        department: formData.department || '',
        to: Array.isArray(formData.to) ? formData.to : [formData.to],
        toOthers: formData.others || '',
        purpose: [],
        purposeOthers: '',
        details: formData.details || '',
        remarks: '',
        actions: [],
      });
      if (formData.attachment) {
        setAttachmentStaff({
          name: formData.attachment.filename,
          type: formData.attachment.mimetype,
          data: formData.attachment.file
        });
      }
    }
  };

  // File conversion
  const toBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleChangeStudent = (e) => {
    setFormStudent({ ...formStudent, [e.target.name]: e.target.value });
  };

  const handleChangeStaff = (e) => {
    setFormStaff({ ...formStaff, [e.target.name]: e.target.value });
  };

  const handleSubmitStudent = async (e) => {
    e.preventDefault();
    let attachment = null;
    if (attachmentStudent && attachmentStudent instanceof File) {
      const encodedFile = await toBase64(attachmentStudent);
      attachment = {
        file: encodedFile.split(',')[1],
        filename: attachmentStudent.name,
        mimetype: attachmentStudent.type,
      };
    } else if (attachmentStudent && attachmentStudent.data) {
      // Keep existing attachment
      attachment = {
        file: attachmentStudent.data,
        filename: attachmentStudent.name,
        mimetype: attachmentStudent.type,
      };
    }

    try {
      const token = jwtDecode(localStorage.getItem('token'));
      const email = token.email;
      const year = token.year;
      const div = token.div;
      
      const updateData = {
        formId: id,
        formType: 'student',
        submittedBy: email,
        to: formStudent.to,
        subject: formStudent.subject,
        details: formStudent.details,
        others: formStudent.toOthers,
        department: formStudent.department,
        attachment: attachment,
        year: year,
        div: div,
        resubmit: true // This will change status back to 'awaiting'
      };

      const response = await axios.put('http://localhost:3096/updateFormContent', updateData);
      alert('Form updated and resubmitted successfully!');
      navigate('/dashboard');
    } catch (error) {
      alert('Update failed. Please try again.');
      console.error(error);
    }
  };

  const handleSubmitStaff = async (e) => {
    e.preventDefault();
    let attachment = null;
    if (attachmentStaff && attachmentStaff instanceof File) {
      const encodedFile = await toBase64(attachmentStaff);
      attachment = {
        file: encodedFile.split(',')[1],
        filename: attachmentStaff.name,
        mimetype: attachmentStaff.type,
      };
    } else if (attachmentStaff && attachmentStaff.data) {
      // Keep existing attachment
      attachment = {
        file: attachmentStaff.data,
        filename: attachmentStaff.name,
        mimetype: attachmentStaff.type,
      };
    }

    try {
      const token = jwtDecode(localStorage.getItem('token'));
      const email = token.email;
      
      const updateData = {
        formId: id,
        formType: 'faculty',
        submittedBy: email,
        to: formStaff.to,
        subject: formStaff.subject,
        details: formStaff.details,
        others: formStaff.toOthers,
        department: formStaff.department,
        attachment: attachment,
        resubmit: true // This will change status back to 'awaiting'
      };

      const response = await axios.put('http://localhost:3096/updateFormContent', updateData);
      alert('Form updated and resubmitted successfully!');
      navigate('/dashboard');
    } catch (error) {
      alert('Update failed. Please try again.');
      console.error(error);
    }
  };

  // Print as a letter, not as a form
  const handlePrintPDF = async () => {
    setShowPrintView(true);
    await new Promise((resolve) => setTimeout(resolve, 100));
    const input = printLetterRef.current;
    const canvas = await html2canvas(input, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const width = pdf.internal.pageSize.getWidth();
    const height = (canvas.height * width) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, width, height);

    const attachment = userRole === 'Student' ? attachmentStudent : attachmentStaff;
    if (attachment) {
      pdf.addPage();
      if (attachment.type && attachment.type.startsWith('image/')) {
        const imgURL = URL.createObjectURL(attachment);
        const img = new window.Image();
        img.src = imgURL;
        await new Promise((resolve) => {
          img.onload = resolve;
        });
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        let imgWidth = img.width;
        let imgHeight = img.height;
        const ratio = Math.min(pageWidth / imgWidth, pageHeight / imgHeight);
        imgWidth *= ratio;
        imgHeight *= ratio;
        pdf.addImage(img, img.type === 'image/png' ? 'PNG' : 'JPEG', (pageWidth - imgWidth) / 2, (pageHeight - imgHeight) / 2, imgWidth, imgHeight);
        URL.revokeObjectURL(imgURL);
      } else if (attachment.type === 'application/pdf') {
        pdf.setFontSize(16);
        pdf.text('Attachment: PDF file is attached separately.', 20, 40);
      } else {
        pdf.setFontSize(16);
        pdf.text('Attachment type not supported for preview.', 20, 40);
      }
    }
    pdf.save('submission.pdf');
    setShowPrintView(false);
  };

  const handleStaffToChange = (event, value) => {
    setFormStaff((prev) => ({ ...prev, to: value ? [value.value] : [] }));
  };

  const handleStudentToChange = (event, value) => {
    let newTo = value ? [value.value] : [];
    if ((newTo.includes('principal') || newTo.includes('hod')) && !newTo.includes('faculty')) {
      newTo = ['faculty'];
    }
    setFormStudent((prev) => ({ ...prev, to: newTo }));
  };

  const handleAttachmentStudent = (e) => {
    const file = e.target.files[0] || null;
    if (file && file.size > 10 * 1024 * 1024) {
      alert('File size exceeds 10 MB limit. Please choose a smaller file.');
      e.target.value = '';
      setAttachmentStudent(null);
      return;
    }
    setAttachmentStudent(file);
  };

  const handleAttachmentStaff = (e) => {
    const file = e.target.files[0] || null;
    if (file && file.size > 10 * 1024 * 1024) {
      alert('File size exceeds 10 MB limit. Please choose a smaller file.');
      e.target.value = '';
      setAttachmentStaff(null);
      return;
    }
    setAttachmentStaff(file);
  };

  // Helper functions
  const getDeptShort = (name) => {
    const found = DEPARTMENT_OPTIONS.find((d) => d.name === name);
    return found ? found.short : '';
  };

  const getDeptLong = (short) => {
    const found = DEPARTMENT_OPTIONS.find((d) => d.short === short);
    return found ? `${found.name} (${found.short})` : short;
  };

  const getRecipientLabels = (toArr, toOthers, isStudent) => {
    const options = isStudent ? TO_OPTIONS_STUDENT : TO_OPTIONS_STAFF;
    const labels = toArr.map(val => {
      const found = options.find(opt => opt.value === val);
      return found ? found.label : val;
    });
    if (toOthers && toOthers.trim()) labels.push(toOthers);
    return labels.join(', ');
  };

  const getPurposeLabels = (purposeArr, purposeOthers) => {
    const labels = purposeArr.map(val => {
      const found = PURPOSE_OPTIONS.find(opt => opt.value === val);
      return found ? found.label : val;
    });
    if (purposeOthers && purposeOthers.trim()) labels.push(purposeOthers);
    return labels.join(', ');
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>;
  }

  if (error) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'red' }}>{error}</div>;
  }

  if (!originalForm) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Form not found.</div>;
  }

  // Check if user can edit this form
  const token = jwtDecode(localStorage.getItem('token'));
  const canEdit = originalForm.status === 'edit' && originalForm.submittedBy === token.email;

  if (!canEdit) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'red' }}>
      You can only edit forms with 'edit' status that you submitted.
    </div>;
  }

  const studentForm = (
    <form className="submission-card" onSubmit={handleSubmitStudent} ref={formRef}>
      <h2 className="form-title">EDIT SUBMISSION - Student</h2>
      <div className="form-meta-row">
        <div>
          <label>No:</label>
          <input type="text" value={originalForm.formNo || originalForm._id} readOnly />
        </div>
        <div>
          <label>Date:</label>
          <input type="date" value={originalForm.date || today} readOnly />
        </div>
      </div>
      <div className="form-row">
        <label>Subject</label>
        <select
          name="subject"
          value={formStudent.subject}
          onChange={handleChangeStudent}
          className="subject-input"
          required
        >
          <option value="" disabled>Select subject</option>
          {PURPOSE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
          <option value="other">Other</option>
        </select>
        {formStudent.subject === 'other' && (
          <input
            type="text"
            name="subjectOther"
            value={formStudent.subjectOther || ''}
            onChange={e => setFormStudent({ ...formStudent, subjectOther: e.target.value })}
            className="long-input"
            placeholder="Enter custom subject"
            required
          />
        )}
      </div>
      <div className="form-row form-checkbox-group">
        <div className="checkbox-label">To:</div>
        <div className="checkboxes" style={{ width: '100%' }}>
          <Autocomplete
            options={TO_OPTIONS_STUDENT}
            getOptionLabel={(option) => option.label}
            value={TO_OPTIONS_STUDENT.find(opt => formStudent.to.includes(opt.value)) || null}
            onChange={handleStudentToChange}
            renderOption={(props, option) => (
              <li {...props}>
                {option.label}
              </li>
            )}
            renderInput={(params) => (
              <TextField {...params} variant="outlined" label="To" placeholder="Select recipient" />
            )}
            isOptionEqualToValue={(option, value) => option.value === value.value}
            style={{ width: '100%' }}
          />
        </div>
      </div>
      <div className="form-row">
        <label>Others:</label>
        <input type="text" name="toOthers" value={formStudent.toOthers} onChange={handleChangeStudent} className="long-input" />
      </div>
      <div className="form-row">
        <label>Department</label>
        <select
          name="department"
          value={formStudent.department}
          onChange={e => setFormStudent({ ...formStudent, department: e.target.value })}
          className="long-input"
          required
        >
          <option value="" disabled>Select department</option>
          {DEPARTMENT_OPTIONS.map((dept) => (
            <option key={dept.short} value={dept.short}>
              {dept.name} ({dept.short})
            </option>
          ))}
        </select>
      </div>
      <div className="form-row">
        <label>Details of Submission:</label>
        <textarea name="details" value={formStudent.details} onChange={handleChangeStudent} rows={3} className="long-input" required />
      </div>
              <div className="form-row">
          <label>Attachment</label>
          <input type="file" onChange={handleAttachmentStudent} />
          {attachmentStudent && attachmentStudent.data && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: '0.9em', color: '#666', marginBottom: 8 }}>
                Current attachment:
              </div>
              <AttachmentViewer attachment={attachmentStudent} />
            </div>
          )}
        </div>
      <div className="form-row form-btn-row">
        <button type="submit" className="submit-btn">Update & Resubmit</button>
        <button type="button" className="cancel-btn" onClick={() => navigate('/dashboard')}>Cancel</button>
        <button type="button" className="print-btn" onClick={handlePrintPDF}>Print as PDF</button>
      </div>
    </form>
  );

  const staffForm = (
    <form className="submission-card" onSubmit={handleSubmitStaff} ref={formRef}>
      <h2 className="form-title">EDIT SUBMISSION</h2>
      <div className="form-meta-row">
        <div>
          <label>No:</label>
          <input type="text" value={originalForm.formNo || originalForm._id} readOnly />
        </div>
        <div>
          <label>Date:</label>
          <input type="date" value={originalForm.date || today} readOnly />
        </div>
      </div>
      <div className="form-row">
        <label>Subject</label>
        <select
          name="subject"
          value={formStaff.subject}
          onChange={handleChangeStaff}
          className="subject-input"
          required
        >
          <option value="" disabled>Select subject</option>
          {PURPOSE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
          <option value="other">Other</option>
        </select>
        {formStaff.subject === 'other' && (
          <input
            type="text"
            name="subjectOther"
            value={formStaff.subjectOther || ''}
            onChange={e => setFormStaff({ ...formStaff, subjectOther: e.target.value })}
            className="long-input"
            placeholder="Enter custom subject"
            required
          />
        )}
      </div>
      <div className="form-row form-checkbox-group">
        <div className="checkbox-label">To:</div>
        <div className="checkboxes" style={{ width: '100%' }}>
          <Autocomplete
            options={TO_OPTIONS_STAFF}
            getOptionLabel={(option) => option.label}
            value={TO_OPTIONS_STAFF.find(opt => formStaff.to.includes(opt.value)) || null}
            onChange={handleStaffToChange}
            renderOption={(props, option) => (
              <li {...props}>
                {option.label}
              </li>
            )}
            renderInput={(params) => (
              <TextField {...params} variant="outlined" label="To" placeholder="Select recipient" />
            )}
            isOptionEqualToValue={(option, value) => option.value === value.value}
            style={{ width: '100%' }}
          />
        </div>
      </div>
      <div className="form-row">
        <label>Others:</label>
        <input type="text" name="toOthers" value={formStaff.toOthers} onChange={handleChangeStaff} className="long-input" />
      </div>
      <div className="form-row">
        <label>Department</label>
        <select
          name="department"
          value={formStaff.department}
          onChange={e => setFormStaff({ ...formStaff, department: e.target.value })}
          className="long-input"
          required
        >
          <option value="" disabled>Select department</option>
          {DEPARTMENT_OPTIONS.map((dept) => (
            <option key={dept.short} value={dept.short}>
              {dept.name} ({dept.short})
            </option>
          ))}
        </select>
      </div>
      <div className="form-row">
        <label>Details of Submission:</label>
        <textarea name="details" value={formStaff.details} onChange={handleChangeStaff} rows={3} className="long-input" required />
      </div>
              <div className="form-row">
          <label>Attachment</label>
          <input type="file" onChange={handleAttachmentStaff} />
          {attachmentStaff && attachmentStaff.data && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: '0.9em', color: '#666', marginBottom: 8 }}>
                Current attachment:
              </div>
              <AttachmentViewer attachment={attachmentStaff} />
            </div>
          )}
        </div>
      <div className="form-row form-btn-row">
        <button type="submit" className="submit-btn">Update & Resubmit</button>
        <button type="button" className="cancel-btn" onClick={() => navigate('/dashboard')}>Cancel</button>
        <button type="button" className="print-btn" onClick={handlePrintPDF}>Print as PDF</button>
      </div>
    </form>
  );

  // Print view as a letter
  const printLetterView = (
    <div className="print-letter-view" ref={printLetterRef} style={{ padding: 40, fontFamily: 'serif', color: '#222', background: '#fff', minHeight: '100vh', width: 700, margin: '0 auto' }}>
      <div style={{ textAlign: 'right', marginBottom: 32 }}>
        <div>Date: {originalForm.date || today}</div>
        <div>No: {originalForm.formNo || originalForm._id}</div>
      </div>
      <div style={{ marginBottom: 24 }}>
        <div>To,</div>
        <div style={{ marginLeft: 32 }}>{userRole === 'Student' ? getRecipientLabels(formStudent.to, formStudent.toOthers, true) : getRecipientLabels(formStaff.to, formStaff.toOthers, false)}</div>
      </div>
      <div style={{ marginBottom: 24 }}>
        <div><b>Subject:</b> {
          PURPOSE_OPTIONS.find(opt => opt.value === (userRole === 'Student' ? formStudent.subject : formStaff.subject))?.label || ''
        }</div>
      </div>
      <div style={{ marginBottom: 24 }}>
        <div>Respected Sir/Madam,</div>
        <div style={{ marginTop: 16, marginLeft: 32 }}>
          {userRole === 'Student' ? formStudent.details : formStaff.details}
        </div>
        {(userRole === 'Student' ? attachmentStudent : attachmentStaff) && (
          <div style={{ marginTop: 16, marginLeft: 32 }}>
            <b>Attachment:</b> {(userRole === 'Student' ? attachmentStudent : attachmentStaff).name}
          </div>
        )}
      </div>
      <div style={{ marginTop: 48 }}>
        <div>Department: {getDeptLong(userRole === 'Student' ? formStudent.department : formStaff.department)}</div>
      </div>
    </div>
  );

  return (
    <div className="submission-outer">
      <h1 className="submission-main-title">Edit Submission</h1>
      {showPrintView ? printLetterView : (userRole === 'Student' ? studentForm : staffForm)}
    </div>
  );
}

export default EditForm; 