const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const facultyFormSchema = new mongoose.Schema({
    formNo: {
        type: Number,
        unique: true
    },
    date: {
        type: Date,
        required: true
    },
    to: {
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
    }
}, { timestamps: true });

facultyFormSchema.plugin(AutoIncrement, { inc_field: 'formNo' });

const FacultyForm = mongoose.model("FacultyForm", facultyFormSchema);
module.exports = FacultyForm;