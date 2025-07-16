// frontend/src/pages/NewSubmission.jsx
import React, { useState, useEffect, useRef } from 'react';
import './NewSubmission.css';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Checkbox from '@mui/material/Checkbox';
import { CheckBoxOutlineBlank, CheckBox } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const initialStateStudent = {
  subject: '',
  department: '',
  to: [],
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
  { label: 'Head of Department (HoD)', value: 'hod' },
  { label: 'Principal', value: 'principal' },
  { label: 'Manager', value: 'manager' },
  { label: 'Committee Convenor', value: 'committee' },
  { label: 'Secretars', value: 'secretary' },
];

const TO_OPTIONS_STUDENT = [
  { label: 'Faculty Advisor', value: 'faculty' },
  { label: 'Head of Department (HoD)', value: 'hod' },
  { label: 'Principal', value: 'principal' },
  { label: 'Manager', value: 'manager' },
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

// function getToken() {
//   return localStorage.getItem('token');
//   console.log(jwtDecode(token))
// }

function NewSubmission() {
  const [userRole, setUserRole] = useState();
  const [formStudent, setFormStudent] = useState({
    ...initialStateStudent,
    subject: '', // will store the value of the dropdown
  });
  const [formStaff, setFormStaff] = useState({
    ...initialStateStaff,
    subject: '', // will store the value of the dropdown
  });
  const today = new Date().toISOString().slice(0, 10);
  const submissionNo = '001/2025';
  const formRef = useRef();
  const printLetterRef = useRef();
  const [showPrintView, setShowPrintView] = useState(false);
  const [attachmentStudent, setAttachmentStudent] = useState(null);
  const [attachmentStaff, setAttachmentStaff] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    var token = jwtDecode(localStorage.getItem('token'));
    // console.log(token)
    if (!token) {
    navigate('/login');
    return;
  }
  try {
    setUserRole(token.role)
  } catch (err) {
    console.error("Invalid token");
    navigate('/login');
  }
    
  }, []);

  // Student: If Principal or HoD is selected, ensure Faculty Advisor is included
  useEffect(() => {
    if (userRole === 'Student') {
      const mustIncludeFaculty = formStudent.to.includes('principal') || formStudent.to.includes('hod');
      if (mustIncludeFaculty && !formStudent.to.includes('faculty')) {
        setFormStudent((prev) => ({ ...prev, to: ['faculty', ...prev.to] }));
      }
    }
    // eslint-disable-next-line
  }, [formStudent.to, userRole]);

  const handleChangeStudent = (e) => {
    setFormStudent({ ...formStudent, [e.target.name]: e.target.value });
  };
  const handleChangeStaff = (e) => {
    setFormStaff({ ...formStaff, [e.target.name]: e.target.value });
  };

  const handleCheckboxStudent = (e, group) => {
    const { value, checked } = e.target;
    setFormStudent((prev) => {
      let arr = prev[group];
      if (group === 'to' && value === 'Faculty') {
        if ((prev.to.includes('principal') || prev.to.includes('hod')) && !checked) {
          return prev; // Don't allow unchecking
        }
      }
      return {
        ...prev,
        [group]: checked ? [...arr, value] : arr.filter((v) => v !== value),
      };
    });
  };
  const handleCheckboxStaff = (e, group) => {
    const { value, checked } = e.target;
    setFormStaff((prev) => {
      let arr = prev[group];
      return {
        ...prev,
        [group]: checked ? [...arr, value] : arr.filter((v) => v !== value),
      };
    });
  };

  const handleSubmitStudent = (e) => {
    e.preventDefault();
    // Save submission to localStorage
    const submissions = JSON.parse(localStorage.getItem('mysubmissions') || '[]');
    const newSubmission = {
      id: Date.now(),
      subject: formStudent.subject,
      department: formStudent.department,
      to: formStudent.to,
      toOthers: formStudent.toOthers,
      details: formStudent.details,
      date: new Date().toISOString().slice(0, 10),
      owner: 'student',
    };
    submissions.push(newSubmission);
    localStorage.setItem('mysubmissions', JSON.stringify(submissions));
    navigate('/mysubmission');
  };
  const handleSubmitStaff = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('date', new Date().toISOString().slice(0, 10));
      formData.append('to', JSON.stringify(formStaff.to));
      formData.append('others', formStaff.toOthers);
      formData.append('department', formStaff.department);
      formData.append('details', formStaff.details);
      if (attachmentStaff) {
        formData.append('attatchment', attachmentStaff);
      }
      console.log(formData)
      await axios.post('http://localhost:3096/facultyFormSubmission', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      navigate('/mysubmission');
    } catch (error) {
      alert('Submission failed. Please try again.');
      console.error(error);
    }
  };

  // Print as a letter, not as a form
  const handlePrintPDF = async () => {
    setShowPrintView(true);
    await new Promise((resolve) => setTimeout(resolve, 100)); // Wait for print view to render
    const input = printLetterRef.current;
    const canvas = await html2canvas(input, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const width = pdf.internal.pageSize.getWidth();
    const height = (canvas.height * width) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, width, height);

    // Add attachment on second page if present and is image or PDF
    const attachment = userRole === 'Student' ? attachmentStudent : attachmentStaff;
    if (attachment) {
      pdf.addPage();
      if (attachment.type.startsWith('image/')) {
        // Render image on second page
        const imgURL = URL.createObjectURL(attachment);
        const img = new window.Image();
        img.src = imgURL;
        await new Promise((resolve) => {
          img.onload = resolve;
        });
        // Fit image to page
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
        // Show a placeholder message for PDF attachments
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

  // --- Student Form ---
  const handleStudentToChange = (event, value) => {
    let newTo = value ? [value.value] : [];
    if ((newTo.includes('principal') || newTo.includes('hod')) && !newTo.includes('faculty')) {
      newTo = ['faculty'];
    }
    setFormStudent((prev) => ({ ...prev, to: newTo }));
  };
  // --- Staff Form ---
  const handleStaffToChange = (event, value) => {
    setFormStaff((prev) => ({ ...prev, to: value ? [value.value] : [] }));
  };
  const handleStudentPurposeChange = (event, value) => {
    setFormStudent((prev) => ({ ...prev, purpose: value ? [value.value] : [] }));
  };
  const handleStaffPurposeChange = (event, value) => {
    setFormStaff((prev) => ({ ...prev, purpose: value ? [value.value] : [] }));
  };
  const icon = <CheckBoxOutlineBlank fontSize="small" />;
  const checkedIcon = <CheckBox fontSize="small" />;

  const handleAttachmentStudent = (e) => {
    setAttachmentStudent(e.target.files[0] || null);
  };
  const handleAttachmentStaff = (e) => {
    setAttachmentStaff(e.target.files[0] || null);
  };

  const studentForm = (
    <form className="submission-card" onSubmit={handleSubmitStudent} ref={formRef}>
      <h2 className="form-title">SUBMISSION</h2>
      <div className="form-meta-row">
        <div>
          <label>No:</label>
          <input type="text" value={submissionNo} readOnly />
        </div>
        <div>
          <label>Date:</label>
          <input type="date" value={today} readOnly />
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
          onChange={handleChangeStudent}
          className="long-input"
          required
        >
          <option value="" disabled>Select department</option>
          {DEPARTMENT_OPTIONS.map((dept) => (
            <option key={dept.name} value={dept.name}>
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
      </div>
      {/* Remarks removed for students */}
      <div className="form-row form-btn-row">
        <button type="submit" className="submit-btn">Submit</button>
        <button type="button" className="cancel-btn" onClick={() => window.history.back()}>Cancel</button>
        <button type="button" className="print-btn" onClick={handlePrintPDF}>Print as PDF</button>
      </div>
    </form>
  );

  // --- Staff Form ---
  const staffForm = (
    <form className="submission-card" onSubmit={handleSubmitStaff} ref={formRef}>
      <h2 className="form-title">SUBMISSION</h2>
      <div className="form-meta-row">
        <div>
          <label>No:</label>
          <input type="text" value={submissionNo} readOnly />
        </div>
        <div>
          <label>Date:</label>
          <input type="date" value={today} readOnly />
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
          onChange={handleChangeStaff}
          className="long-input"
          required
        >
          <option value="" disabled>Select department</option>
          {DEPARTMENT_OPTIONS.map((dept) => (
            <option key={dept.name} value={dept.name}>
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
      </div>
      {/* Remarks removed for staff */}
      <div className="form-row form-btn-row">
        <button type="submit" className="submit-btn">Submit</button>
        <button type="button" className="cancel-btn" onClick={() => window.history.back()}>Cancel</button>
        <button type="button" className="print-btn" onClick={handlePrintPDF}>Print as PDF</button>
      </div>
    </form>
  );

  // Helper to get department short form
  const getDeptShort = (name) => {
    const found = DEPARTMENT_OPTIONS.find((d) => d.name === name);
    return found ? found.short : '';
  };

  // Helper to get recipient labels
  const getRecipientLabels = (toArr, toOthers, isStudent) => {
    const options = isStudent ? TO_OPTIONS_STUDENT : TO_OPTIONS_STAFF;
    const labels = toArr.map(val => {
      const found = options.find(opt => opt.value === val);
      return found ? found.label : val;
    });
    if (toOthers && toOthers.trim()) labels.push(toOthers);
    return labels.join(', ');
  };

  // Helper to get purpose labels
  const getPurposeLabels = (purposeArr, purposeOthers) => {
    const labels = purposeArr.map(val => {
      const found = PURPOSE_OPTIONS.find(opt => opt.value === val);
      return found ? found.label : val;
    });
    if (purposeOthers && purposeOthers.trim()) labels.push(purposeOthers);
    return labels.join(', ');
  };

  // Print view as a letter
  const printLetterView = (
    <div className="print-letter-view" ref={printLetterRef} style={{ padding: 40, fontFamily: 'serif', color: '#222', background: '#fff', minHeight: '100vh', width: 700, margin: '0 auto' }}>
      <div style={{ textAlign: 'right', marginBottom: 32 }}>
        <div>Date: {today}</div>
        <div>No: {submissionNo}</div>
      </div>
      <div style={{ marginBottom: 24 }}>
        <div>To,</div>
        <div style={{ marginLeft: 32 }}>{userRole === 'student' ? getRecipientLabels(formStudent.to, formStudent.toOthers, true) : getRecipientLabels(formStaff.to, formStaff.toOthers, false)}</div>
      </div>
      <div style={{ marginBottom: 24 }}>
        <div><b>Subject:</b> {
          PURPOSE_OPTIONS.find(opt => opt.value === (userRole === 'student' ? formStudent.subject : formStaff.subject))?.label || ''
        }</div>
      </div>
      <div style={{ marginBottom: 24 }}>
        <div>Respected Sir/Madam,</div>
        <div style={{ marginTop: 16, marginLeft: 32 }}>
          {userRole === 'student' ? formStudent.details : formStaff.details}
        </div>
        {/* Remarks removed for staff */}
        {(userRole === 'student' ? attachmentStudent : attachmentStaff) && (
          <div style={{ marginTop: 16, marginLeft: 32 }}>
            <b>Attachment:</b> {(userRole === 'student' ? attachmentStudent : attachmentStaff).name}
          </div>
        )}
      </div>
      <div style={{ marginTop: 48 }}>
        <div>Department: {userRole === 'student' ? formStudent.department : formStaff.department} ({getDeptShort(userRole === 'student' ? formStudent.department : formStaff.department)})</div>
      </div>
    </div>
  );

function RoleSubmissionForm({ userRole, studentForm, staffForm, printLetterView, showPrintView }) {
  if (showPrintView) return printLetterView;
  if (userRole === 'Student') return studentForm;
  return staffForm;
}

  return (
    <div className="submission-outer">
      <h1 className="submission-main-title">Submission and Approval</h1>
      <RoleSubmissionForm userRole={userRole} studentForm={studentForm} staffForm={staffForm} printLetterView={printLetterView} showPrintView={showPrintView} />
    </div>
  );
}

export default NewSubmission; 