const express = require('express');
const router = express.Router();
const TeacherAssignment = require('../models/TeacherAssignment');
const Classification = require('../models/Classification');
const Student = require('../models/Student');
const Task = require('../models/Task');
const StudentTaskStatus = require('../models/StudentTaskStatus');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const { authMiddleware, requireRole } = require('../middleware/auth');

// All routes here require teacher
router.use(authMiddleware, requireRole('teacher'));

// Get assigned classes and subjects
router.get('/assignments', async (req, res) => {
    try {
        const assignments = await TeacherAssignment.find({ teacherId: req.user.userId }).populate('classId subjectId');
        res.json(assignments);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching assignments' });
    }
});

// Get students by classification for a class/subject
router.get('/students', async (req, res) => {
    try {
        const { classId, subjectId } = req.query;
        const students = await Student.find({ classId });
        const classifications = await Classification.find({ subjectId, studentId: { $in: students.map(s => s._id) } });
        // Group by category
        const grouped = { Weak: [], Good: [], Brilliant: [] };
        for (const cls of classifications) {
            const student = students.find(s => s._id.equals(cls.studentId));
            if (student) grouped[cls.category].push(student);
        }
        res.json(grouped);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching students by classification' });
    }
});

// Assign task to a group (category) in a class/subject
router.post('/tasks', async (req, res) => {
    try {
        const { description, classId, subjectId, targetCategory } = req.body;
        // Find students in the category
        const students = await Student.find({ classId });
        const classifications = await Classification.find({ subjectId, category: targetCategory, studentId: { $in: students.map(s => s._id) } });
        const assignedTo = classifications.map(c => c.studentId);
        const task = new Task({ description, teacherId: req.user.userId, classId, subjectId, targetCategory, assignedTo });
        await task.save();
        // Create StudentTaskStatus for each student
        for (const studentId of assignedTo) {
            await StudentTaskStatus.create({ studentId, taskId: task._id });
        }
        res.status(201).json(task);
    } catch (err) {
        res.status(500).json({ message: 'Error assigning task' });
    }
});

// Get tasks assigned by teacher
router.get('/tasks', async (req, res) => {
    try {
        const tasks = await Task.find({ teacherId: req.user.userId }).populate('classId subjectId');
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching tasks' });
    }
});

// Delete a task (by teacher)
router.delete('/tasks/:id', async (req, res) => {
    try {
        const task = await Task.findOne({ _id: req.params.id, teacherId: req.user.userId });
        if (!task) return res.status(404).json({ message: 'Task not found or not authorized' });
        await task.deleteOne();
        // Also delete all StudentTaskStatus for this task
        await StudentTaskStatus.deleteMany({ taskId: task._id });
        res.json({ message: 'Task deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting task' });
    }
});

// Get list of students who marked as complete but not confirmed (for this teacher's tasks)
router.get('/pending-confirmations', async (req, res) => {
    try {
        const tasks = await Task.find({ teacherId: req.user.userId });
        const taskIds = tasks.map(t => t._id);
        const pending = await StudentTaskStatus.find({
            taskId: { $in: taskIds },
            completionStatus: 'completed',
            teacherConfirmed: { $ne: true }
        }).populate([
            { path: 'studentId', select: 'name rollNumber' },
            { path: 'taskId', populate: { path: 'classId subjectId' } }
        ]);
        res.json(pending);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching pending confirmations' });
    }
});

// Endpoint to confirm completion
router.post('/confirm-completion/:statusId', async (req, res) => {
    try {
        const { statusId } = req.params;
        const status = await StudentTaskStatus.findById(statusId).populate('taskId');
        if (!status) return res.status(404).json({ message: 'Status not found' });
        if (!status.taskId.teacherId.equals(req.user.userId)) {
            return res.status(403).json({ message: 'Not allowed' });
        }
        status.teacherConfirmed = true;
        await status.save();
        res.json({ message: 'Completion confirmed' });
    } catch (err) {
        res.status(500).json({ message: 'Error confirming completion' });
    }
});

// Get list of students who have completed work (teacher confirmed)
router.get('/completed-students', async (req, res) => {
    try {
        const tasks = await Task.find({ teacherId: req.user.userId });
        const taskIds = tasks.map(t => t._id);
        const completed = await StudentTaskStatus.find({
            taskId: { $in: taskIds },
            completionStatus: 'completed',
            teacherConfirmed: true
        }).populate([
            { path: 'studentId', select: 'name rollNumber' },
            { path: 'taskId', populate: { path: 'classId subjectId' } }
        ]);
        res.json(completed);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching completed students' });
    }
});

// Get list of students who did NOT complete assignments (for this teacher's tasks)
router.get('/not-completed-students', async (req, res) => {
    try {
        const tasks = await Task.find({ teacherId: req.user.userId });
        const taskIds = tasks.map(t => t._id);
        // Find all StudentTaskStatus where completionStatus is 'pending'
        const notCompleted = await StudentTaskStatus.find({
            taskId: { $in: taskIds },
            completionStatus: 'pending'
        }).populate([
            { path: 'studentId', select: 'name rollNumber' },
            { path: 'taskId', populate: { path: 'classId subjectId' } }
        ]);
        res.json(notCompleted);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching not completed students' });
    }
});

// --- Allow any teacher to see all classes and subjects ---
// Get all classes
router.get('/all-classes', async (req, res) => {
    try {
        const classes = await Class.find();
        res.json(classes);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching classes' });
    }
});

// Get all subjects
router.get('/all-subjects', async (req, res) => {
    try {
        const subjects = await Subject.find();
        res.json(subjects);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching subjects' });
    }
});

module.exports = router;
