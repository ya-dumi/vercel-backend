const mongoose = require('mongoose');

const ClassificationSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    category: { type: String, enum: ['Weak', 'Good', 'Brilliant'], required: true }
}, { timestamps: true });

module.exports = mongoose.model('Classification', ClassificationSchema);
