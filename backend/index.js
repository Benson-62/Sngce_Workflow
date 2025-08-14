const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

require('./connection');

const logmodel = require('./models/User');

const PORT = process.env.PORT || 3096;

const app = express();
app.use(cors());
app.use(express.json({ limit: '15mb' }));

// Models
const fFormModel = require('./models/facultyForm');
const sFormModel = require('./models/studentForm');
const fAdvisorModel = require('./models/facultyAdvisor');

// Routes

/**
 * GET /getFacultyAdvisor
 * Finds the class assignments for a specific faculty member within a department.
 *
 * Query Parameters:
 * - email (string): The faculty member's email address.
 * - department (string): The department to search within.
 */
app.get('/getFacultyAdvisor', async (req, res) => {
  const { email, department } = req.query;
  // console.log(email, department);
  // --- Basic input validation ---
  if (!email || !department) {
    return res.status(400).send({ message: 'Email and department are required query parameters.' });
  }

  try {
    // --- Corrected Mongoose Query ---
    // 1. Use 'facultyNames.email' to query the nested field inside the array.
    // 2. Combine conditions in a single query object. This is an implicit "AND".
    const assignments = await fAdvisorModel.find({
      department: department,
      'facultyNames.email': email
    });
    // console.log(assignments)

    if (assignments.length === 0) {
      // It's good practice to handle cases where nothing is found.
      return res.status(404).send({ message: 'No assignments found for this faculty member in the specified department.' });
    }

    // console.log('Successfully found assignments:', assignments);
    res.status(200).send(assignments);

  } catch (error) {
    console.error("Error in /getFacultyAdvisor:", error);
    // --- Send a structured error response ---
    res.status(500).send({ message: 'An error occurred while fetching advisor data.', error: error.message });
  }
});
// Filtered Faculty Forms
app.get('/getFForms', async(req,res)=>{
var {role, department} = req.body;
console.log(role)
console.log(department)
  try{
    if(role != 'principal' || role != 'manager'){
      const forms = await fFormModel.find({to :role, department : department});
      console.log("1")
      console.log(forms)
      res.send(forms.map(s => ({ ...s.toObject(), owner: 'faculty' })));
    }else{
      const formVar = await fFormModel.find({to : role});
      console.log(formVar)
      res.send(formVar)
    }
  }catch(error){
    console.log(error)
    res.send(error)
  }
})
// Filtered Student Forms
app.get('/getSForms', async(req,res)=>{
var {role, department} = req.body;
console.log(role)
console.log(department)
  try{
    if(role != 'principal' || role != 'manager'){
      const forms = await sFormModel.find({to :role, department : department});
      console.log("1")
      console.log(forms)
      res.send(forms.map(s => ({ ...s.toObject(), owner: 'student' })));
    }else{
      const formVar = await sFormModel.find({to : role});
      console.log(formVar)
      res.send(formVar)
    }
  }catch(error){
    console.log(error)
    res.send(error)
  }
})
// Get all Faculty Forms
app.get('/getAllFForms', async(req,res)=>{
  try{
    const forms = await fFormModel.find();
    console.log(forms)
    res.send(forms.map(s => ({ ...s.toObject(), owner: 'faculty' })));
  }catch(error){
    console.log(error)
    res.send(error)
  }
})
// Get all Student Forms
app.get('/getAllSForms', async(req,res)=>{
  try{
    const forms = await sFormModel.find();
    console.log(forms)
    res.send(forms.map(s => ({ ...s.toObject(), owner: 'student' })));
  }catch(error){
    console.log(error)
    res.send(error)
  }
})
// Get Student Forms by user
app.get('/getSFormsByUser', async (req, res) => {
  const { email } = req.query;
  try {
    const forms = await sFormModel.find({ submittedBy: email });
    res.send(forms.map(s => ({ ...s.toObject(), owner: 'student' })));
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});
// Get Faculty Forms by user
app.get('/getFFormsByUser', async (req, res) => {
  const { email } = req.query;
  try {
    const forms = await fFormModel.find({ submittedBy: email });
    res.send(forms.map(s => ({ ...s.toObject(), owner: 'faculty' })));
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});
// Get single Student Form by ID
app.get('/getSFormById/:id', async (req, res) => {
  console.log(req.params.id)
  try {
    const form = await sFormModel.findById(req.params.id);
    if (!form) return res.status(404).send('Not found');
    res.send({ ...form.toObject(), owner: 'student' });
  } catch (error) {
    res.status(500).send(error);
  }
});
// Get single Faculty Form by ID
app.get('/getFFormById/:id', async (req, res) => {
  console.log(req.params.id)
  try {
    const form = await fFormModel.findById(req.params.id);
    if (!form) return res.status(404).send('Not found');
    res.send({ ...form.toObject(), owner: 'faculty' });  
  } catch (error) {
    res.status(500).send(error);
  }
});

app.post('/createFacultyAdvisor', async (req,res)=> {
  const { year, department, facultyNames,div} = req.body;
  try {
    await fAdvisorModel({year, department, facultyNames,div}).save();
    console.log("Saved to DB!");
    res.send("Saved to DB!");
  } catch (error){
    console.log(error);
    res.send(error);
  }
});


app.post('/facultyFormSubmission', async (req, res) => {
  const { date, to, subject, others, department, details, attachment , submittedBy} = req.body;
  console.log(req.body);
  try {
    await fFormModel({ date, to, subject, others, department, details, attachment, submittedBy }).save();
    console.log("form submitted!")
    res.send('Form submitted');
  } catch (error) {
    console.log(error);
    res.status(500).send("Form submission failed");
  }
});
app.post('/studentFormSubmission', async (req, res) => {
  const { date, to, subject, others, department, details, attachment , submittedBy, div, year} = req.body;
  console.log(req.body);
  try {
    await sFormModel({ date, to, subject, others, department, details, attachment, submittedBy , div, year}).save();
    console.log("form submitted!")
    res.send('Form submitted');
  } catch (error) {
    console.log(error);
    res.status(500).send("Form submission failed");
  }
});

app.post('/createAccount', async (req, res) => {
  const { fName, lName, email, password, role, department,year, div } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    if(!year || !div){
      console.log("No year or div provided, creating account without them");
      await logmodel({ fName, lName, email, password: hashedPassword, role , department}).save();
    }else{
      await logmodel({ fName, lName, email, password: hashedPassword, role , department, year, div}).save();
    }
    res.send("User added");
  } catch (error) {
    console.log(error);
    res.status(500).send("Account creation failed");
  }
});

// Update user details
app.put('/updateUser', async (req, res) => {
  const { email, updates } = req.body;
  if (!email || !updates || typeof updates !== 'object') {
    return res.status(400).send({ message: 'Email and updates object are required.' });
  }

  try {
    const allowedRoles = new Set(['Student', 'Faculty', 'Principal', 'Manager', 'HOD', 'FacultyAdvisor', 'Admin']);
    const allowedDepartments = new Set(['CSE', 'NASB', 'ECE', 'EEE', 'ME', 'CE', 'AI', 'CS', 'MCA']);

    const changes = {};
    if (typeof updates.fName === 'string') changes.fName = updates.fName.trim();
    if (typeof updates.lName === 'string') changes.lName = updates.lName.trim();
    if (typeof updates.role === 'string') {
      if (!allowedRoles.has(updates.role)) {
        return res.status(400).send({ message: `Invalid role: ${updates.role}` });
      }
      changes.role = updates.role;
    }
    if (typeof updates.department === 'string') {
      if (!allowedDepartments.has(updates.department)) {
        return res.status(400).send({ message: `Invalid department: ${updates.department}` });
      }
      changes.department = updates.department;
    }
    if (updates.year !== undefined) {
      const yearNum = Number(updates.year);
      if (!Number.isFinite(yearNum)) {
        return res.status(400).send({ message: 'year must be a number' });
      }
      changes.year = yearNum;
    }
    if (updates.div !== undefined) {
      changes.div = String(updates.div);
    }
    if (typeof updates.password === 'string' && updates.password.length > 0) {
      changes.password = await bcrypt.hash(updates.password, 10);
    }

    if (Object.keys(changes).length === 0) {
      return res.status(400).send({ message: 'No valid fields to update.' });
    }

    const updated = await logmodel.findOneAndUpdate(
      { email },
      { $set: changes },
      { new: true }
    ).lean();

    if (!updated) {
      return res.status(404).send({ message: 'User not found' });
    }

    // Remove password from response
    delete updated.password;
    res.status(200).send(updated);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).send({ message: 'Failed to update user', error: error.message });
  }
});

// Bulk create users from an array of user objects
app.post('/bulkCreateUsers', async (req, res) => {
  const { users } = req.body;

  if (!Array.isArray(users) || users.length === 0) {
    return res.status(400).send({ message: 'Request body must include a non-empty users array.' });
  }

  const allowedRoles = new Set(['Student', 'Faculty', 'Principal', 'Manager', 'HOD', 'FacultyAdvisor', 'Admin']);
  const allowedDepartments = new Set(['CSE', 'NASB', 'ECE', 'EEE', 'ME', 'CE', 'AI', 'CS', 'MCA']);

  const roleMap = {
    student: 'Student',
    faculty: 'Faculty',
    principal: 'Principal',
    manager: 'Manager',
    hod: 'HOD',
    facultyadvisor: 'FacultyAdvisor',
    'faculty advisor': 'FacultyAdvisor',
    admin: 'Admin'
  };

  const deptMap = {
    cse: 'CSE', nasb: 'NASB', ece: 'ECE', eee: 'EEE', me: 'ME', ce: 'CE', ai: 'AI', cs: 'CS', mca: 'MCA'
  };

  const created = [];
  const failed = [];

  for (const raw of users) {
    try {
      const fName = (raw.fName || '').toString().trim();
      const lName = (raw.lName || '').toString().trim();
      const email = (raw.email || '').toString().trim().toLowerCase();
      const password = (raw.password || '').toString();
      let role = (raw.role || '').toString().trim();
      let department = (raw.department || '').toString().trim();
      const div = raw.div ? raw.div.toString().trim() : undefined;
      const year = raw.year !== undefined && raw.year !== null && raw.year !== '' ? Number(raw.year) : undefined;

      if (!fName || !lName || !email || !password || !role || !department) {
        failed.push({ email: email || raw.email || '', reason: 'Missing required fields' });
        continue;
      }

      // Normalize role and department
      const roleKey = role.toLowerCase();
      if (roleMap[roleKey]) role = roleMap[roleKey];
      // Capitalize single-word roles otherwise
      if (!allowedRoles.has(role)) {
        failed.push({ email, reason: `Invalid role: ${role}` });
        continue;
      }

      const deptKey = department.toLowerCase();
      if (deptMap[deptKey]) department = deptMap[deptKey];
      if (!allowedDepartments.has(department)) {
        failed.push({ email, reason: `Invalid department: ${department}` });
        continue;
      }

      // Check duplicate
      const existing = await logmodel.findOne({ email });
      if (existing) {
        failed.push({ email, reason: 'Email already exists' });
        continue;
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const payload = { fName, lName, email, password: hashedPassword, role, department };
      if (div) payload.div = div;
      if (Number.isFinite(year)) payload.year = year;

      const saved = await new logmodel(payload).save();
      created.push({ email: saved.email });
    } catch (err) {
      console.error('Failed to create user from bulk:', err);
      failed.push({ email: (raw && raw.email) || '', reason: 'Unexpected error' });
    }
  }

  res.status(200).send({
    createdCount: created.length,
    failedCount: failed.length,
    created,
    failed
  });
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const usr = await logmodel.findOne({ email });
    if (!usr) return res.status(400).send("Invalid Credentials");

    const isMatch = await bcrypt.compare(password, usr.password);
    if (!isMatch) return res.status(400).send("Invalid Credentials");

    const token = jwt.sign(
      { _id: usr._id, email: usr.email, role: usr.role, department: usr.department, year : usr.year, div : usr.div },
      'pineapplepie',
      { expiresIn: '2h' }
    );

    res.send({
      _id: usr._id,
      fName: usr.fName,
      lName: usr.lName,
      email: usr.email,
      role: usr.role,
      token
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Login failed");
  }
});

// Get all users
app.get('/getAllUsers', async (req, res) => {
  try {
    const users = await logmodel.find();
    res.send(users);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Unified endpoint for all roles
app.get('/getFormsForUser', async (req, res) => {
  const { email, role } = req.query;
  try {
    if (role === 'admin' || role === 'Admin') {
      // Admin: return all forms
      const [facultyForms, studentForms] = await Promise.all([
        fFormModel.find(),
        sFormModel.find()
      ]);
      res.send([
        ...facultyForms.map(f => ({ ...f.toObject(), owner: 'staff' })),
        ...studentForms.map(s => ({ ...s.toObject(), owner: 'student' }))
      ]);
    } else if (role === 'student' || role === 'Student') {
      // Student: only their forms
      const forms = await sFormModel.find({ submittedBy: email });
      res.send(forms.map(s => ({ ...s.toObject(), owner: 'student' })));
    } else {
      // Staff: only their forms
      const forms = await fFormModel.find({ submittedBy: email });
      res.send(forms.map(f => ({ ...f.toObject(), owner: 'staff' })));
    }
  } catch (error) {
    res.status(500).send(error);
  }
});

// Archived forms (final status) for a user
app.get('/getArchivedForms', async (req, res) => {
  const { email, role } = req.query;
  if (!email || !role) {
    return res.status(400).send({ message: 'Missing required parameters: email, role' });
  }

  try {
    // Pull user context for department/year/div filtering
    const user = await logmodel.findOne({ email }).lean();
    const userDepartment = user?.department;
    const userYear = user?.year;
    const userDiv = user?.div;

    const finalStatuses = ['accepted', 'rejected'];

    // 1. Forms submitted by this user that have final status
    const [submittedStudent, submittedFaculty] = await Promise.all([
      sFormModel.find({ submittedBy: email, status: { $in: finalStatuses } }).lean(),
      fFormModel.find({ submittedBy: email, status: { $in: finalStatuses } }).lean(),
    ]);

    const submitted = [
      ...submittedStudent.map(s => ({ ...s, owner: 'student', type: 'student', category: 'submitted' })),
      ...submittedFaculty.map(f => ({ ...f, owner: 'staff', type: 'faculty', category: 'submitted' })),
    ];

    // 2. Forms received by this user role that have final status
    let received = [];
    const normalizedRole = (role || '').toString();

    if (normalizedRole.toLowerCase() === 'student') {
      // Students do not receive forms; only submitted applies
      received = [];
    } else {
      // Faculty/Staff: filter by role and user context
      const facultyReceived = await fFormModel.find({
        to: normalizedRole,
        ...(userDepartment ? { department: userDepartment } : {}),
        status: { $in: finalStatuses },
      }).lean();

      const allStudentFinal = await sFormModel.find({ status: { $in: finalStatuses } }).lean();
      const studentReceived = allStudentFinal.filter(form => {
        const toArray = Array.isArray(form.to) ? form.to : [form.to];
        const isRecipient = toArray.includes(normalizedRole) && (
          (normalizedRole === 'HOD' && form.department === userDepartment) ||
          (normalizedRole === 'FacultyAdvisor' && form.department === userDepartment && (userYear == null || form.year == userYear) && (userDiv == null || form.div === userDiv)) ||
          (!['HOD', 'FacultyAdvisor'].includes(normalizedRole))
        );
        return isRecipient;
      });

      received = [
        ...facultyReceived.map(f => ({ ...f, owner: 'staff', type: 'faculty', category: 'received' })),
        ...studentReceived.map(s => ({ ...s, owner: 'student', type: 'student', category: 'received' })),
      ];
    }

    // Combine and sort by date desc
    const response = [...submitted, ...received].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.status(200).send(response);
  } catch (error) {
    console.error('Error in /getArchivedForms:', error);
    res.status(500).send({ message: 'An error occurred while fetching archived forms', error: error.message });
  }
});

// Endpoint to get received forms for a user
/**
 * GET /getReceivedFormsForUser
 * Fetches forms that have been sent to a specific user based on their role, department, year, and division.
 *
 * Query Parameters:
 * - role (string): The user's role (e.g., 'FacultyAdvisor', 'HOD', 'Principal').
 * - department (string): The user's department (required for 'FacultyAdvisor' and 'HOD').
 * - year (number): The user's assigned year (required for 'FacultyAdvisor').
 * - div (string): The user's assigned division (required for 'FacultyAdvisor').
 */
app.get('/getReceivedFormsForUser', async (req, res) => {
  const { role, department, year, div } = req.query;
  console.log(role, department, year, div);

  // --- Input Validation ---
  if (!role) {
    return res.status(400).send({ message: 'Role is a required query parameter.' });
  }
  if (role === 'HOD' && !department) {
    return res.status(400).send({ message: 'Department is required for HOD role.' });
  }
  if (role === 'FacultyAdvisor' && (!department || !year || !div)) {
    return res.status(400).send({ message: 'Department, year, and div are required for FacultyAdvisor role.' });
  }

  try {
    // --- 1. Find Received Forms from Faculty/Staff ---
    let facultyReceived;
    if (role === 'Principal' || role === 'principal') {
      // Principal sees all faculty forms addressed to them
      facultyReceived = await fFormModel.find({ to: { $in: [role, 'Principal', 'principal'] } });
    } else {
      // For other roles, match role; restrict by department only for HOD
      const facultyQuery = { to: role };
      if ((role === 'HOD' || role === 'hod') && department) {
        facultyQuery.department = department;
      }
      facultyReceived = await fFormModel.find(facultyQuery);
    }

    // --- 2. Find Received Forms from Students ---
    // Student forms require specific checks for HOD (department) and FacultyAdvisor (department, year, div).
    // We use .lean() for better performance as it returns plain JS objects.
    const allStudentForms = await sFormModel.find().lean();

    const studentReceived = allStudentForms.filter(form => {
      const toArray = Array.isArray(form.to) ? form.to : [form.to];

      // Check #1: Is the current user an intended recipient of this form?
      const isRecipient = toArray.some(recipient => 
        (recipient === role || 
         (role === 'Principal' && recipient === 'principal') ||
         (role === 'principal' && recipient === 'Principal'))
      ) && (
        // For HOD, department must also match
        (role === 'HOD' && form.department === department) ||
        // For FacultyAdvisor, department, year, and div must match
        (role === 'FacultyAdvisor' && form.department === department && form.year == year && form.div === div) ||
        // For Principal and other high-level roles, role match is sufficient
        ['Principal', 'principal', 'Manager', 'manager'].includes(role)
      );

      // If the user isn't a recipient, we can immediately exclude this form.
      if (!isRecipient) {
        return false;
      }

      // Check #2: Does the form follow the routing hierarchy rule?
      // Rule: If a form is addressed to HOD or higher, it must have been routed via the FacultyAdvisor.
      // Exception: Principal and Manager can see forms directly without FacultyAdvisor routing
      const isToHodOrHigher = toArray.some(r => ['HOD', 'Principal', 'principal', 'Manager', 'manager'].includes(r));
      const includesFacultyAdvisor = toArray.includes('FacultyAdvisor');
      const isPrincipalOrManager = ['Principal', 'principal', 'Manager', 'manager'].includes(role);

      if (isToHodOrHigher && !includesFacultyAdvisor && !isPrincipalOrManager) {
        // This form is "stuck" and hasn't been routed correctly yet, so don't show it to HOD
        // But Principal and Manager can see all forms addressed to them
        return false;
      }

      // If both checks pass, include the form.
      return true;
    });
    console.log(facultyReceived, studentReceived);
    // --- 3. Combine, Format, and Send the Response ---
    res.send([
      ...facultyReceived.map(f => ({ ...f.toObject(), owner: 'staff' })),
      ...studentReceived.map(s => ({ ...s, owner: 'student' })) // .lean() was used, so .toObject() is not needed
    ]);

  } catch (error) {
    console.error("Error in /getReceivedFormsForUser:", error);
    res.status(500).send({ message: "An error occurred while fetching forms.", error: error.message });
  }
});


// Endpoint to update remarks and status for a form
// app.put('/updateFormRemarksStatus', async (req, res) => {
//   const { formId, formType, remarks, status, to } = req.body;
//   console.log(req.body);
//   try {
//     let model;
//     if (formType === 'student') {
//       model = sFormModel;
//     } else if (formType === 'faculty') {
//       model = fFormModel;
//     } else {
//       return res.status(400).send('Invalid form type');
//     }
//     const updateFields = {};
//     if (remarks !== undefined) updateFields.remarks = remarks;
//     if (status !== undefined) updateFields.status = status;
//     if (to !== undefined) updateFields.to = to;
//     const updated = await model.findByIdAndUpdate(
//       formId,
//       updateFields,
//       { new: true }
//     );
//     if (!updated) return res.status(404).send('Form not found');
//     res.send(updated);
//   } catch (error) {
//     res.status(500).send(error);
//   }
// });

// app.listen(PORT, () => {
//   console.log(`Port is up and running at ${PORT}`);
// });

// app.put('/updateFormRemarksStatus', async (req, res) => {
//   const { formId, formType, remarks, status, to, by } = req.body;
//   console.log(formType, remarks, status, to, by);
//   try {
//     let model;
//     if (formType === 'student') {
//     } else {
//       return res.status(400).send('Invalid form type');
//     }
//     console.log(model)
//     const updateFields = {};
//     if (remarks !== undefined) updateFields.remarks = remarks;
//     if (status !== undefined) updateFields.status = status;
//     if (to !== undefined) updateFields.to = to;

//     // Construct history action string
//     let action = '';
//     if (status === 'forwarded' && Array.isArray(to)) {
//       // Find the last two roles in the 'to' array
//       const last = to[to.length - 1];
//       const prev = to[to.length - 2] || '';
//       action = `${formType} forwarded to ${last.toLowerCase()}`;
//       if (prev) action = `${prev.toLowerCase()} forwarded to ${last.toLowerCase()}`;
//     } else if (status) {
//       action = `${formType} status changed to ${status}`;
//     } else if (remarks) {
//       action = `${formType} remarks updated`;
//     }
//     const historyEntry = {
//       action,
//       by: by || 'system',
//       timestamp: new Date(),
//       remarks: remarks || ''
//     };

//     // Update with $push to history
//     const ret = await model.findByIdAndUpdate(
//       formId,
//       {
//         $set: updateFields,
//         $push: { history: historyEntry }
//       },
//       { new: true }
//     );
//     console.log(ret)
//     if (!updated) return res.status(404).send('Form not found');
//     res.send(ret);
//   } catch (error) {
//     res.status(500).send(error);
//   }
// });


app.put('/updateFormRemarksStatus', async (req, res) => {
  const { formId, formType, remarks, status, to, by } = req.body;

  try {
    let model;
    // --- Correctly assign the model based on formType ---
    if (formType === 'student') {
      model = sFormModel;
    } else if (formType === 'faculty') {
      model = fFormModel;
    } else {
      // This now correctly handles any other invalid type
      return res.status(400).send({ message: `Invalid form type: ${formType}` });
    }

    // Fetch current form to enforce completion rules
    const currentForm = await model.findById(formId).lean();
    if (!currentForm) {
      return res.status(404).send({ message: 'Form not found with the provided formId.' });
    }
    if (currentForm.status === 'accepted' || currentForm.status === 'rejected') {
      return res.status(400).send({ message: 'This form is already completed and cannot be modified.' });
    }

    const updateFields = {};
    if (remarks !== undefined) updateFields.remarks = remarks;
    if (status !== undefined) updateFields.status = status;
    if (to !== undefined) updateFields.to = to;

    // Construct history action string
    let action = '';
    if (status === 'forwarded' && Array.isArray(to) && to.length > 1) {
      const last = to[to.length - 1];
      const prev = to[to.length - 2];
      action = `${prev.toLowerCase()} forwarded to ${last.toLowerCase()}`;
    } else if (status) {
      action = `${formType} status changed to ${status}`;
    } else if (remarks) {
      action = `Remarks updated`;
    }

    // --- FIX: Check if there's any actual update to perform ---
    // An update is only meaningful if we are changing a field OR if there's a descriptive action for the history.
    if (Object.keys(updateFields).length === 0 && !action) {
      return res.status(400).send({ message: 'No update data provided. Please provide remarks, status, or a new recipient.' });
    }

    const historyEntry = {
      action,
      by: by || 'system', // Default to 'system' if 'by' is not provided
      timestamp: new Date(),
      remarks: remarks || ''
    };

    // --- Add more detailed logging for debugging ---
    console.log(`Attempting to update formId: ${formId}`);
    console.log('Fields to $set:', JSON.stringify(updateFields, null, 2));
    console.log('Entry to $push to history:', JSON.stringify(historyEntry, null, 2));

    // Update with $set to update fields and $push to add to history
    const updatedForm = await model.findByIdAndUpdate(
      formId,
      {
        $set: updateFields,
        $push: { history: historyEntry }
      },
      { new: true, runValidators: true } // This returns the updated document and runs schema validators
    );
    console.log(updatedForm)
    // Check if the form was actually found and updated
    if (!updatedForm) {
      return res.status(404).send({ message: 'Form not found with the provided formId.' });
    }

    console.log('Update successful. Returning updated form.');
    res.status(200).send(updatedForm);
    
  } catch (error) {
    console.error("Error in /updateFormRemarksStatus:", error);
    res.status(500).send({ message: 'An internal server error occurred.', error: error.message });
  }
});

// Delete form endpoint - allows deletion of forms with 'awaiting' status by authorized users
app.delete('/deleteForm', async (req, res) => {
  const { formId, formType, userEmail, userRole } = req.body;
  
  console.log('Delete request:', { formId, formType, userEmail, userRole });
  
  // Input validation
  if (!formId || !formType || !userEmail || !userRole) {
    return res.status(400).send({ message: 'Missing required parameters: formId, formType, userEmail, userRole' });
  }
  
  try {
    let model;
    if (formType === 'student') {
      model = sFormModel;
    } else if (formType === 'faculty') {
      model = fFormModel;
    } else {
      return res.status(400).send({ message: `Invalid form type: ${formType}` });
    }
    
    // Find the form first
    const form = await model.findById(formId);
    if (!form) {
      return res.status(404).send({ message: 'Form not found' });
    }
    
    // Check if form status allows deletion (awaiting or edit)
    if (form.status !== 'awaiting' && form.status !== 'edit' && !form.status) {
      return res.status(400).send({ message: 'Only forms with "awaiting" or "edit" status can be deleted' });
    }
    
    // Check authorization:
    // 1. User can delete forms they submitted
    // 2. User can delete forms that were sent to them (if they are a valid receiver)
    const canDelete = form.submittedBy === userEmail || isValidReceiver(form, userEmail, userRole);
    
    if (!canDelete) {
      return res.status(403).send({ message: 'You are not authorized to delete this form' });
    }
    
    // Delete the form
    await model.findByIdAndDelete(formId);
    
    console.log(`Form ${formId} deleted successfully by ${userEmail}`);
    res.status(200).send({ message: 'Form deleted successfully' });
    
  } catch (error) {
    console.error('Error deleting form:', error);
    res.status(500).send({ message: 'An error occurred while deleting the form', error: error.message });
  }
});

// Helper function to check if user is a valid receiver for a form
function isValidReceiver(form, userEmail, userRole) {
  // Admin can delete any form (except in some cases)
  if (userRole === 'admin' || userRole === 'Admin') {
    return true;
  }
  
  // Students cannot delete received forms (they only submit)
  if (userRole === 'Student' || userRole === 'student') {
    return false;
  }
  
  // Check if user's role is in the "to" field
  const toArray = Array.isArray(form.to) ? form.to : [form.to];
  return toArray.includes(userRole);
}

// Get forwarded forms for a user (forms they submitted that have been forwarded)
app.get('/getForwardedFormsForUser', async (req, res) => {
  const { email, role } = req.query;
  
  console.log('Fetching forwarded forms for:', { email, role });
  
  if (!email || !role) {
    return res.status(400).send({ message: 'Missing required parameters: email, role' });
  }
  
  try {
    // Get forms submitted by this user from both student and faculty models
    const [studentForms, facultyForms] = await Promise.all([
      sFormModel.find({ submittedBy: email }),
      fFormModel.find({ submittedBy: email })
    ]);
    
    // Combine and filter forms that have been forwarded (status is not 'awaiting')
    const allForms = [...studentForms, ...facultyForms];
    const forwardedForms = allForms.filter(form => 
      form.status && form.status !== 'awaiting'
    );
    
    console.log(`Found ${forwardedForms.length} forwarded forms for ${email}`);
    
    // Sort by most recent first
    forwardedForms.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.status(200).send(forwardedForms);
    
  } catch (error) {
    console.error('Error fetching forwarded forms:', error);
    res.status(500).send({ message: 'An error occurred while fetching forwarded forms', error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Port is up and running at ${PORT}`);
});