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
  dept :{
    type: String,
    enum : ["CS", "EC","ME", "EEE", "CE", "NASB"],
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
  }
}, { timestamps: true });

var User=mongoose.model("User",userSchema);
module.exports=User;