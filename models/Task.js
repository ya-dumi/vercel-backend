const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
    description: { type: String, required: true },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    targetCategory: { type: String, enum: ['Weak', 'Good', 'Brilliant'], required: true },
    creationDate: { type: Date, default: Date.now },
    assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
    status: { type: String, enum: ['assigned'], default: 'assigned' }
}, { timestamps: true });

module.exports = mongoose.model('Task', TaskSchema);
