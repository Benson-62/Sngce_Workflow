const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

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
    }
}, { timestamps: true });

studentFormSchema.plugin(AutoIncrement, { inc_field: 'studentFormNo' });

const studentForm = mongoose.model("StudentForm", studentFormSchema);
module.exports = studentForm;