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
  username: {
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
    required: true
  }
}, { timestamps: true });
var User=mongoose.model("User",userSchema);
module.exports=User;