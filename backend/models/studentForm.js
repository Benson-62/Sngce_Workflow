const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);
const Counter = require('./Counter');

const studentFormSchema = new mongoose.Schema({
    formNo: {
        type: Number,
        unique: true
    },
    date: {
        type: Date,
        required: true
    },
    to: {
        type: [String],
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    others: {
        type: String
    },
    department: {
        type: String,
        required : true
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
    year : {
        type: Number,
    },
    div : {
        type: String,
    },
}, { timestamps: true });

studentFormSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        { _id: "studentFormId" },
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

// studentFormSchema.plugin(AutoIncrement, { inc_field: 'studentFormNo' });

const studentForm = mongoose.model("StudentForm", studentFormSchema);
module.exports = studentForm;