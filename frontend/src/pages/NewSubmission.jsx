// frontend/src/pages/NewSubmission.jsx
import React, { useState, useEffect, useRef } from 'react';
import './NewSubmission.css';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Checkbox from '@mui/material/Checkbox';
import { CheckBoxOutlineBlank, CheckBox } from '@mui/icons-material';

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

function getUserRole() {
  return localStorage.getItem('userRole') || 'staff';
}

function NewSubmission() {
  const [userRole, setUserRole] = useState(getUserRole());
  const [formStudent, setFormStudent] = useState(initialStateStudent);
  const [formStaff, setFormStaff] = useState(initialStateStaff);
  const today = new Date().toISOString().slice(0, 10);
  const submissionNo = '001/2025';
  const formRef = useRef();

  useEffect(() => {
    setUserRole(getUserRole());
  }, []);

  // Student: If Principal or HoD is selected, ensure Faculty Advisor is included
  useEffect(() => {
    if (userRole === 'student') {
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
      if (group === 'to' && value === 'faculty') {
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
    alert('Student submission created!');
  };
  const handleSubmitStaff = (e) => {
    e.preventDefault();
    alert('Staff submission created!');
  };

  // Print the form as it appears on screen
  const handlePrintPDF = async () => {
    const input = formRef.current;
    const canvas = await html2canvas(input, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const width = pdf.internal.pageSize.getWidth();
    const height = (canvas.height * width) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, width, height);
    pdf.save('submission.pdf');
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
        <input type="text" name="subject" value={formStudent.subject} onChange={handleChangeStudent} className="subject-input" required />
      </div>
      <div className="form-row">
        <label>Department</label>
        <input type="text" name="department" value={formStudent.department} onChange={handleChangeStudent} className="long-input" required />
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
      <div className="form-row form-checkbox-group">
        <div className="checkbox-label">Purpose of Submission:</div>
        <div className="checkboxes" style={{ width: '100%' }}>
          <Autocomplete
            options={PURPOSE_OPTIONS}
            getOptionLabel={(option) => option.label}
            value={PURPOSE_OPTIONS.find(opt => formStudent.purpose.includes(opt.value)) || null}
            onChange={handleStudentPurposeChange}
            renderOption={(props, option) => (
              <li {...props}>
                {option.label}
              </li>
            )}
            renderInput={(params) => (
              <TextField {...params} variant="outlined" label="Purpose of Submission" placeholder="Select purpose" />
            )}
            isOptionEqualToValue={(option, value) => option.value === value.value}
            style={{ width: '100%' }}
          />
        </div>
      </div>
      <div className="form-row">
        <label>Others:</label>
        <input type="text" name="purposeOthers" value={formStudent.purposeOthers} onChange={handleChangeStudent} className="long-input" />
      </div>
      <div className="form-row">
        <label>Details of Submission:</label>
        <textarea name="details" value={formStudent.details} onChange={handleChangeStudent} rows={3} className="long-input" required />
      </div>
      <div className="form-row">
        <label>Remarks (if any):</label>
        <input type="text" name="remarks" value={formStudent.remarks} onChange={handleChangeStudent} className="long-input" />
      </div>
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
        <input type="text" name="subject" value={formStaff.subject} onChange={handleChangeStaff} className="subject-input" required />
      </div>
      <div className="form-row">
        <label>Department</label>
        <input type="text" name="department" value={formStaff.department} onChange={handleChangeStaff} className="long-input" required />
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
      <div className="form-row form-checkbox-group">
        <div className="checkbox-label">Purpose of Submission:</div>
        <div className="checkboxes" style={{ width: '100%' }}>
          <Autocomplete
            options={PURPOSE_OPTIONS}
            getOptionLabel={(option) => option.label}
            value={PURPOSE_OPTIONS.find(opt => formStaff.purpose.includes(opt.value)) || null}
            onChange={handleStaffPurposeChange}
            renderOption={(props, option) => (
              <li {...props}>
                {option.label}
              </li>
            )}
            renderInput={(params) => (
              <TextField {...params} variant="outlined" label="Purpose of Submission" placeholder="Select purpose" />
            )}
            isOptionEqualToValue={(option, value) => option.value === value.value}
            style={{ width: '100%' }}
          />
        </div>
      </div>
      <div className="form-row">
        <label>Others:</label>
        <input type="text" name="purposeOthers" value={formStaff.purposeOthers} onChange={handleChangeStaff} className="long-input" />
      </div>
      <div className="form-row">
        <label>Details of Submission:</label>
        <textarea name="details" value={formStaff.details} onChange={handleChangeStaff} rows={3} className="long-input" required />
      </div>
      <div className="form-row">
        <label>Remarks (if any):</label>
        <input type="text" name="remarks" value={formStaff.remarks} onChange={handleChangeStaff} className="long-input" />
      </div>
      <div className="form-row form-checkbox-group">
        <div className="checkbox-label">Actions Taken:</div>
        <div className="checkboxes">
          {ACTION_OPTIONS.map((opt) => (
            <label key={opt.value} className="checkbox-inline">
              <input type="checkbox" value={opt.value} checked={formStaff.actions.includes(opt.value)} onChange={(e) => handleCheckboxStaff(e, 'actions')} />
              {opt.label}
            </label>
          ))}
        </div>
      </div>
      <div className="form-row form-btn-row">
        <button type="submit" className="submit-btn">Submit</button>
        <button type="button" className="cancel-btn" onClick={() => window.history.back()}>Cancel</button>
        <button type="button" className="print-btn" onClick={handlePrintPDF}>Print as PDF</button>
      </div>
    </form>
  );

  return (
    <div className="submission-outer">
      <h1 className="submission-main-title">Submission and Approval</h1>
      {userRole === 'student' ? studentForm : staffForm}
    </div>
  );
}

export default NewSubmission; 