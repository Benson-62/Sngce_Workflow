const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);
const Counter = require('./Counter');

const facultyFormSchema = new mongoose.Schema({
    formNo: {
        type: Number,
        unique: true
    },
    date: {
        type: Date,
        required: true
    },
    subject : {
        type: String,
        required: true
    },
    to: {
        type: [String],
        required: true
    },
    others: {
        type: String
    },
    department: {
        type: String
    },
    details: {
        type: String
    },
    attachment: {
        file: { type: Buffer},
        filename: { type: String},
        mimetype: { type: String}
    },
    status : {
        type : String,
        enum : ['awaiting', 'forwarded', 'accepted', 'rejected'],
        default : 'awaiting'
    },
    submittedBy : {
        type : String,
        required : true
    },
    history: [
    {
    action: {
        type: String, // e.g., r'submitted', 'forwarded to principal', 'accepted by principal'
    },
    by: {
        type: String, // could be name, email, or role
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    remarks: String
    }
    ],
    currentHandler: {
        type: String // Optional: Who currently has the form (e.g., 'hod@college.edu')
    },
    remarks: {
        type: String
    },
    formType : {
        type : String,
        enum : ['student', 'faculty']
    }
}, { timestamps: true });

facultyFormSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        { _id: "facultyFormId" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      this.formNo = counter.seq;
      next();
    } catch (err) {
      next(err);
    }
  } else {
    next();
  }
});

// facultyFormSchema.plugin(AutoIncrement, { inc_field: 'facultyFormNo' });


// facultyFormSchema.plugin(AutoIncrement.plugin, {
//   model: 'facultyForm',
//   field: 'formNo',
//   startAt: 1,
//   incrementBy: 1
// });
const facultyForm = mongoose.model("FacultyForm", facultyFormSchema);
module.exports = facultyForm;