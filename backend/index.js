var express=require('express');
require('./connection');
var logmodel=require('./models/User');
var cors = require('cors')
var bcrypt = require('bcrypt')
var jwt = require('jsonwebtoken');
const PORT = process.env.PORT || 3096;



var app=express();
app.use(cors())
app.use(express.json());

// app.get('/',(req,res)=>(
//   res.send('Hello from backend')
// ))

app.post('/createAccount',async(req,res)=>{  
    var {fName,lName,email, password, role} = req.body
    console.log(email)
    console.log(password)
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
        await logmodel({fName,lName,email : email, password : hashedPassword,role:role}).save()
        res.send("user added")
    } catch (error) {
        console.log(error);
    }
});

app.post('/login',async(req,res)=>{
    var {email, password, role} = req.body;
    try {
        var usr =await logmodel.findOne({email});
        if(!usr){
            return res.status(400).send("Invalid Credentials Usrname")
        }
        const isMatch = await bcrypt.compare(password, usr.password);
        if (!isMatch) {
            return res.status(400).send("Invalid credentials Passwrd");
        }
        // Generate JWT
        const token = jwt.sign({
          _id: usr._id,
          email: usr.email,
          role: usr.role
        }, 'pineapplepie', { expiresIn: '2h' });
        res.send({
            _id: usr._id,
            fName : usr.fName,
            lName : usr.lName,
            email: usr.email,
            role: usr.role,
            token
          });
    } catch (error) {
        console.log(error);
    }
});

app.listen(PORT,()=>{
    console.log(`Port is up and running at ${PORT}`);
})