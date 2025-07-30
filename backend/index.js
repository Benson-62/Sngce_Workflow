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
  const { year, department, facultyNames} = req.body;
  try {
    await fAdvisorModel({year, department, facultyNames}).save();
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
  const { fName, lName, email, password, role } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    await logmodel({ fName, lName, email, password: hashedPassword, role }).save();
    res.send("User added");
  } catch (error) {
    console.log(error);
    res.status(500).send("Account creation failed");
  }
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
    // For staff forms, we only check if the 'to' field contains the user's role.
    // The more specific checks are only applied to student forms.
    const facultyQuery = { to: role };
    const facultyReceived = await fFormModel.find(facultyQuery);

    // --- 2. Find Received Forms from Students ---
    // Student forms require specific checks for HOD (department) and FacultyAdvisor (department, year, div).
    // We use .lean() for better performance as it returns plain JS objects.
    const allStudentForms = await sFormModel.find().lean();

    const studentReceived = allStudentForms.filter(form => {
      const toArray = Array.isArray(form.to) ? form.to : [form.to];

      // Check #1: Is the current user an intended recipient of this form?
      const isRecipient = toArray.includes(role) && (
        // For HOD, department must also match
        (role === 'HOD' && form.department === department) ||
        // For FacultyAdvisor, department, year, and div must match
        (role === 'FacultyAdvisor' && form.department === department && form.year == year && form.div === div) ||
        // For other roles (Principal, etc.), role match is sufficient
        !['HOD', 'FacultyAdvisor'].includes(role)
      );

      // If the user isn't a recipient, we can immediately exclude this form.
      if (!isRecipient) {
        return false;
      }

      // Check #2: Does the form follow the routing hierarchy rule?
      // Rule: If a form is addressed to HOD or higher, it must have been routed via the FacultyAdvisor.
      const isToHodOrHigher = toArray.some(r => ['HOD', 'Principal', 'Manager'].includes(r));
      const includesFacultyAdvisor = toArray.includes('FacultyAdvisor');

      if (isToHodOrHigher && !includesFacultyAdvisor) {
        // This form is "stuck" and hasn't been routed correctly yet, so don't show it.
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
app.put('/updateFormRemarksStatus', async (req, res) => {
  const { formId, formType, remarks, status, to } = req.body;
  console.log(req.body);
  try {
    let model;
    if (formType === 'student') {
      model = sFormModel;
    } else if (formType === 'faculty') {
      model = fFormModel;
    } else {
      return res.status(400).send('Invalid form type');
    }
    const updateFields = {};
    if (remarks !== undefined) updateFields.remarks = remarks;
    if (status !== undefined) updateFields.status = status;
    if (to !== undefined) updateFields.to = to;
    const updated = await model.findByIdAndUpdate(
      formId,
      updateFields,
      { new: true }
    );
    if (!updated) return res.status(404).send('Form not found');
    res.send(updated);
  } catch (error) {
    res.status(500).send(error);
  }
});

app.listen(PORT, () => {
  console.log(`Port is up and running at ${PORT}`);
});