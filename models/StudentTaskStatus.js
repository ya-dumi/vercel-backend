const mongoose = require('mongoose');

const StudentTaskStatusSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
    completionStatus: { type: String, enum: ['pending', 'completed'], default: 'pending' },
    teacherConfirmed: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('StudentTaskStatus', StudentTaskStatusSchema);
