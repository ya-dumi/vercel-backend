const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    rollNumber: { type: String, required: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    previousMarks: [
        {
            subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
            marks: { type: Number, required: true }
        }
    ]
}, { timestamps: true });

module.exports = mongoose.model('Student', StudentSchema);
