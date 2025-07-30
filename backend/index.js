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

app.get('/getFacultyAdvisor',async(req,res)=>{
  var {year, department} = req.body;
  try{
    const adv  = await fAdvisorModel.find({
      year, department
    })
    console.log('successful')
    console.log(adv)
    res.send(adv)
  }catch (error){
    console.log(error)
    res.send(error)
  }
})
// Filtered Faculty Forms
app.get('/getFForms', async(req,res)=>{
var {role, department} = req.body;
console.log(role)
console.log(department)
  try{
    if(role != 'Principal' || role != 'Manager'){
      const formVar = await fFormModel.find({to :role, department : department});
      console.log("1")
      console.log(formVar)
      res.send(formVar)
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
    if(role != 'Principal' || role != 'Manager'){
      const formVar = await sFormModel.find({to :role, department : department});
      console.log("1")
      console.log(formVar)
      res.send(formVar)
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
    const formVar = await fFormModel.find();
    console.log(formVar)
    res.send(formVar)
  }catch(error){
    console.log(error)
    res.send(error)
  }
})
// Get all Student Forms
app.get('/getAllSForms', async(req,res)=>{
  try{
    const formVar = await sFormModel.find();
    console.log(formVar)
    res.send(formVar)
  }catch(error){
    console.log(error)
    res.send(error)
  }
})

//archive form backend
// Get Student Forms by user
app.get('/getSFormsByUser', async (req, res) => {
  const { email } = req.query;
  try {
    const forms = await sFormModel.find({ submittedBy: email });
    res.send(forms);
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
    res.send(forms);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});
// Get single Student Form by ID
app.get('/getSFormById/:id', async (req, res) => {
  try {
    const form = await sFormModel.findById(req.params.id);
    if (!form) return res.status(404).send('Not found');
    res.send(form);
  } catch (error) {
    res.status(500).send(error);
  }
});
// Get single Faculty Form by ID
app.get('/getFFormById/:id', async (req, res) => {
  try {
    const form = await fFormModel.findById(req.params.id);
    if (!form) return res.status(404).send('Not found');
    res.send(form);
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
  console.log('Faculty form submission:', req.body);
  try {
    const savedForm = await fFormModel({ date, to, subject, others, department, details, attachment, submittedBy }).save();
    console.log("Faculty form submitted successfully! Form ID:", savedForm._id, "Submitted by:", submittedBy);
    res.send('Form submitted');
  } catch (error) {
    console.log('Faculty form submission error:', error);
    res.status(500).send("Form submission failed");
  }
});
app.post('/studentFormSubmission', async (req, res) => {
  const { date, to, subject, others, department, details, attachment , submittedBy} = req.body;
  console.log('Student form submission:', req.body);
  try {
    const savedForm = await sFormModel({ date, to, subject, others, department, details, attachment, submittedBy }).save();
    console.log("Student form submitted successfully! Form ID:", savedForm._id, "Submitted by:", submittedBy);
    res.send('Form submitted');
  } catch (error) {
    console.log('Student form submission error:', error);
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
      { _id: usr._id, email: usr.email, role: usr.role },
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
  console.log('Getting forms for user:', email, role);
  
  try {
    if (role === 'admin' || role === 'Admin') {
      // Admin: return all forms
      const [facultyForms, studentForms] = await Promise.all([
        fFormModel.find(),
        sFormModel.find()
      ]);
      console.log('Admin - Faculty forms:', facultyForms.length, 'Student forms:', studentForms.length);
      res.send([
        ...facultyForms.map(f => ({ ...f.toObject(), owner: 'staff' })),
        ...studentForms.map(s => ({ ...s.toObject(), owner: 'student' }))
      ]);
    } else if (role === 'student' || role === 'Student') {
      // Student: only their forms
      const forms = await sFormModel.find({ submittedBy: email });
      console.log('Student forms found for', email, ':', forms.length);
      res.send(forms.map(s => ({ ...s.toObject(), owner: 'student' })));
    } else {
      // Staff: only their forms
      const forms = await fFormModel.find({ submittedBy: email });
      console.log('Staff forms found for', email, ':', forms.length);
      res.send(forms.map(f => ({ ...f.toObject(), owner: 'staff' })));
    }
  } catch (error) {
    console.error('Error getting forms for user:', error);
    res.status(500).send(error);
  }
});

// Debug endpoint to see all forms
app.get('/debug/forms', async (req, res) => {
  try {
    const facultyForms = await fFormModel.find();
    const studentForms = await sFormModel.find();
    
    console.log('All faculty forms:', facultyForms.map(f => ({ formNo: f.formNo, to: f.to, submittedBy: f.submittedBy })));
    console.log('All student forms:', studentForms.map(s => ({ formNo: s.formNo, to: s.to, submittedBy: s.submittedBy })));
    
    res.send({
      facultyForms: facultyForms.map(f => ({ formNo: f.formNo, to: f.to, submittedBy: f.submittedBy, status: f.status })),
      studentForms: studentForms.map(s => ({ formNo: s.formNo, to: s.to, submittedBy: s.submittedBy, status: s.status }))
    });
  } catch (error) {
    res.status(500).send(error);
  }
});

// Endpoint to get received forms for a user
app.get('/getReceivedFormsForUser', async (req, res) => {
  const { email, role } = req.query;
  console.log('Getting received forms for:', email, role);
  try {
    // For faculty forms: received if 'to' includes the user's email or role
    const facultyReceived = await fFormModel.find({ to: { $in: [email, role] } });
    console.log('Faculty forms received:', facultyReceived.length);

    // For student forms: received if 'to' includes the user's email or role
    // If sent to HoD or higher, must also be routed through Faculty Advisor
    const studentForms = await sFormModel.find();
    console.log('Total student forms:', studentForms.length);
    const studentReceived = studentForms.filter(form => {
      // Faculty Advisor should receive ALL student forms
      if (role === 'FacultyAdvisor') {
        return true;
      }
      // For other roles: received if the user is in the 'to' field (by email or role)
      const toArray = Array.isArray(form.to) ? form.to : [form.to];
      return toArray.includes(email) || toArray.includes(role);
    });

    console.log('Student forms received:', studentReceived.length);

    const result = [
      ...facultyReceived.map(f => ({ 
        ...f.toObject(), 
        owner: 'staff',
        category: f.submittedBy === email ? 'submitted' : 'received'
      })),
      ...studentReceived.map(s => ({ 
        ...s.toObject(), 
        owner: 'student',
        category: s.submittedBy === email ? 'submitted' : 'received'
      }))
    ];
    
    console.log('Total received forms:', result.length);
    console.log('Forms breakdown:', {
      facultySubmitted: facultyReceived.filter(f => f.submittedBy === email).length,
      facultyReceived: facultyReceived.filter(f => f.submittedBy !== email).length,
      studentSubmitted: studentReceived.filter(s => s.submittedBy === email).length,
      studentReceived: studentReceived.filter(s => s.submittedBy !== email).length
    });
    res.send(result);
  } catch (error) {
    console.error('Error getting received forms:', error);
    res.status(500).send(error);
  }
});

// Fixed endpoint to get received forms for a user
app.get('/getReceivedFormsForUserFixed', async (req, res) => {
  const { email, role } = req.query;
  console.log('Getting received forms for:', email, role);
  
  try {
    let facultyReceived = [];
    let studentReceived = [];

    // For faculty forms: received if 'to' includes the user's email or role
    facultyReceived = await fFormModel.find({ to: { $in: [email, role] } });
    console.log('Faculty forms received:', facultyReceived.length);

    // For student forms: received if 'to' includes the user's email or role
    const studentForms = await sFormModel.find();
    console.log('Total student forms:', studentForms.length);
    
    studentReceived = studentForms.filter(form => {
      const toArray = Array.isArray(form.to) ? form.to : [form.to];
      
      // Check if this user should receive this form
      const isReceived = toArray.includes(email) || toArray.includes(role);
      
      if (isReceived) {
        console.log('Student form received by', email, ':', form.formNo, 'to:', toArray, 'role:', role);
      }
      
      return isReceived;
    });

    console.log('Student forms received:', studentReceived.length);

    // Add category field to distinguish submitted vs received
    const result = [
      ...facultyReceived.map(f => ({ 
        ...f.toObject(), 
        owner: 'staff',
        category: f.submittedBy === email ? 'submitted' : 'received'
      })),
      ...studentReceived.map(s => ({ 
        ...s.toObject(), 
        owner: 'student',
        category: s.submittedBy === email ? 'submitted' : 'received'
      }))
    ];
    
    console.log('Total received forms:', result.length);
    console.log('Forms breakdown:', {
      facultySubmitted: facultyReceived.filter(f => f.submittedBy === email).length,
      facultyReceived: facultyReceived.filter(f => f.submittedBy !== email).length,
      studentSubmitted: studentReceived.filter(s => s.submittedBy === email).length,
      studentReceived: studentReceived.filter(s => s.submittedBy !== email).length
    });
    
    res.send(result);
  } catch (error) {
    console.error('Error getting received forms:', error);
    res.status(500).send(error);
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

// Endpoint to delete a form
app.delete('/deleteForm', async (req, res) => {
  const { formId, formType, userEmail, userRole } = req.body;
  console.log('Deleting form:', formId, formType, 'by user:', userEmail, userRole);
  
  try {
    let model;
    if (formType === 'student') {
      model = sFormModel;
    } else if (formType === 'faculty') {
      model = fFormModel;
    } else {
      return res.status(400).send('Invalid form type');
    }
    
    // First, find the form to check ownership
    const form = await model.findById(formId);
    if (!form) {
      return res.status(404).send('Form not found');
    }
    
    // Authorization checks
    if (userRole === 'admin' || userRole === 'Admin') {
      // Admin can delete any form
      console.log('Admin deleting form:', formId);
    } else {
      // Non-admin users can only delete their own forms
      if (form.submittedBy !== userEmail) {
        console.log('Unauthorized deletion attempt:', userEmail, 'tried to delete form by:', form.submittedBy);
        return res.status(403).send('You can only delete your own forms');
      }
      
      // Additional check: only allow deletion of forms with 'awaiting' status
      if (form.status !== 'awaiting') {
        console.log('Attempt to delete non-awaiting form:', formId, 'status:', form.status);
        return res.status(400).send('Only forms with "awaiting" status can be deleted');
      }
    }
    
    // Proceed with deletion
    const deleted = await model.findByIdAndDelete(formId);
    if (!deleted) {
      return res.status(404).send('Form not found');
    }
    
    console.log('Form deleted successfully:', formId, 'by user:', userEmail);
    res.send({ message: 'Form deleted successfully', deletedForm: deleted });
  } catch (error) {
    console.error('Error deleting form:', error);
    res.status(500).send(error);
  }
});

app.listen(PORT, () => {
  console.log(`Port is up and running at ${PORT}`);
});