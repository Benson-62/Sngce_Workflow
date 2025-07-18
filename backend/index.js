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

app.listen(PORT, () => {
  console.log(`Port is up and running at ${PORT}`);
});