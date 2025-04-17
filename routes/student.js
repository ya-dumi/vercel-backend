const express = require('express');
const router = express.Router();
const StudentTaskStatus = require('../models/StudentTaskStatus');
const Task = require('../models/Task');
const { authMiddleware, requireRole } = require('../middleware/auth');
const Student = require('../models/Student'); 

// All routes here require student
router.use(authMiddleware, requireRole('student'));

// Get all tasks assigned to the student
router.get('/tasks', async (req, res) => {
    try {
        // Find the Student document for this user
        const student = await Student.findOne({ userId: req.user.userId });
        if (!student) {
            return res.status(404).json({ message: 'Student record not found' });
        }
        // Now use student._id to find tasks
        const statuses = await StudentTaskStatus.find({ studentId: student._id }).populate({
            path: 'taskId',
            populate: { path: 'teacherId classId subjectId' }
        });
        const tasks = statuses.map(s => ({
            ...s.taskId._doc,
            completionStatus: s.completionStatus,
            statusId: s._id
        }));
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching tasks' });
    }
});



// Mark a task as completed
router.post('/tasks/:statusId/complete', async (req, res) => {
    try {
        const { statusId } = req.params;
        const status = await StudentTaskStatus.findById(statusId);
        if (!status) {
            return res.status(404).json({ message: 'Task status not found' });
        }
        // Find the Student document for this user
        const student = await Student.findOne({ userId: req.user.userId });
        if (!student || !status.studentId.equals(student._id)) {
            return res.status(403).json({ message: 'Not allowed' });
        }
        status.completionStatus = 'completed';
        await status.save();
        res.json({ message: 'Task marked as completed' });
    } catch (err) {
        res.status(500).json({ message: 'Error marking task complete' });
    }
});

module.exports = router;
