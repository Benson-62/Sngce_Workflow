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
    if(role != 'Principal' || role != 'Manager'){
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
    form.map(s=>({...s.toObject(), owner : 'student'}));
    console.log(res)
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
    res.send(form.map(s => ({ ...s.toObject(), owner: 'faculty' })));
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
  const { date, to, subject, others, department, details, attachment , submittedBy} = req.body;
  console.log(req.body);
  try {
    await sFormModel({ date, to, subject, others, department, details, attachment, submittedBy }).save();
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
app.get('/getReceivedFormsForUser', async (req, res) => {
  const { email, role } = req.query;
  try {
    // For faculty forms: received if 'to' includes the user's email or role
    const facultyReceived = await fFormModel.find({ to: { $in: [email, role] } });

    // For student forms: received if 'to' includes the user's email or role
    // If sent to HoD or higher, must also be routed through Faculty Advisor
    const studentForms = await sFormModel.find();
    const studentReceived = studentForms.filter(form => {
      // If the form is sent to HoD or Principal or Manager, it must also include Faculty Advisor
      const toArray = Array.isArray(form.to) ? form.to : [form.to];
      const isToHodOrHigher = toArray.some(r => ['HOD', 'Principal', 'Manager'].includes(r));
      const includesFacultyAdvisor = toArray.includes('FacultyAdvisor');
      // If it's to HoD or higher, must also include FacultyAdvisor
      if (isToHodOrHigher && !includesFacultyAdvisor) return false;
      // Received if the user is in the 'to' field (by email or role)
      return toArray.includes(email) || toArray.includes(role);
    });

    res.send([
      ...facultyReceived.map(f => ({ ...f.toObject(), owner: 'staff' })),
      ...studentReceived.map(s => ({ ...s.toObject(), owner: 'student' }))
    ]);
  } catch (error) {
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

app.listen(PORT, () => {
  console.log(`Port is up and running at ${PORT}`);
});