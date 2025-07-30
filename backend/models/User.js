var mongoose = require('mongoose');
const userSchema = mongoose.Schema({
  fName :{
    type : String,
    required : true,
  },
  lName :{
    type : String,
    required : true,
  },
  department :{
    type: String,
    enum : ["CSE", "NASB","ECE", "EEE", "ME", "CE", "AI", "CS", "MCA"],
    require: true
  },
  email: {
    type: String, 
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String, 
    enum : ["Student", "Faculty", "Principal", "Manager", "HOD", "FacultyAdvisor", "Admin"],
    required: true
  },
  div : {
    type: String
  },
  year : {
    type: Number
  },
}, { timestamps: true });

var User=mongoose.model("User",userSchema);
module.exports=User;