const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const TeacherAssignment = require('../models/TeacherAssignment');
const Classification = require('../models/Classification');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { classifyMark } = require('../utils/classification');

// All routes here require admin
router.use(authMiddleware, requireRole('admin'));

// --- Students CRUD ---
router.post('/students', async (req, res) => {
    console.log('--- /students route hit ---', req.body);
    try {
        const { name, rollNumber, classId, previousMarks, email, password } = req.body;

        console.log('Step 1: Checking required fields');
        if (!name || !rollNumber || !classId || !email || !password) {
            console.log('Missing required fields');
            return res.status(400).json({ message: 'All fields required' });
        }

        console.log('Step 2: Checking if user exists');
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log('User with this email already exists');
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        console.log('Step 3: Hashing password');
        const bcrypt = require('bcryptjs');
        const passwordHash = await bcrypt.hash(password, 10);

        console.log('Step 4: Creating user');
        const user = new User({
            username: email,
            email,
            passwordHash,
            role: 'student'
        });
        await user.save();

        console.log('Step 5: Creating student');
        const student = new Student({
            userId: user._id,
            name,
            rollNumber,
            classId,
            previousMarks
        });
        await student.save();

        // --- CLASSIFICATION LOGIC ---
        for (const markObj of previousMarks) {
            const category = classifyMark(Number(markObj.marks));
            await Classification.create({
                studentId: student._id,
                subjectId: markObj.subjectId,
                category
            });
        }
        console.log('Step 6: Student and classifications created successfully');
        res.status(201).json(student);
    } catch (err) {
        console.error('Error creating student:', err);
        res.status(500).json({ 
            message: 'Error creating student', 
            error: err.message, 
            stack: err.stack 
        });
    }
});

router.get('/students', async (req, res) => {
    try {
        const students = await Student.find().populate('userId classId previousMarks.subjectId');
        res.json(students);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching students' });
    }
});

router.put('/students/:id', async (req, res) => {
    try {
        const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(student);
    } catch (err) {
        res.status(500).json({ message: 'Error updating student' });
    }
});

router.delete('/students/:id', async (req, res) => {
    try {
        await Student.findByIdAndDelete(req.params.id);
        res.json({ message: 'Student deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting student' });
    }
});

// --- Teachers CRUD ---
router.post('/teachers', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check for required fields
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email, and password are required' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        // Create user
        const bcrypt = require('bcryptjs');
        const passwordHash = await bcrypt.hash(password, 10);
        const user = new User({
            username: email, // or use a different username logic
            email,
            passwordHash,
            role: 'teacher'
        });
        await user.save();

        // Create teacher and link to user
        const teacher = new Teacher({ name, userId: user._id });
        await teacher.save();

        res.status(201).json(teacher);
    } catch (err) {
        console.error('Error creating teacher:', err); // This prints the full error in your terminal
        res.status(500).json({ 
            message: 'Error creating teacher', 
            error: err.message, 
            stack: err.stack 
        }); // This sends the error details to the frontend
    }
});

router.get('/teachers', async (req, res) => {
    try {
        const teachers = await Teacher.find().populate('userId');
        res.json(teachers);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching teachers' });
    }
});

router.put('/teachers/:id', async (req, res) => {
    try {
        const teacher = await Teacher.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(teacher);
    } catch (err) {
        res.status(500).json({ message: 'Error updating teacher' });
    }
});

router.delete('/teachers/:id', async (req, res) => {
    try {
        await Teacher.findByIdAndDelete(req.params.id);
        res.json({ message: 'Teacher deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting teacher' });
    }
});

// --- Classes CRUD ---
router.post('/classes', async (req, res) => {
    try {
        const { name } = req.body;
        const classDoc = new Class({ name });
        await classDoc.save();
        res.status(201).json(classDoc);
    } catch (err) {
        res.status(500).json({ message: 'Error creating class' });
    }
});

router.get('/classes', async (req, res) => {
    try {
        const classes = await Class.find();
        res.json(classes);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching classes' });
    }
});

router.put('/classes/:id', async (req, res) => {
    try {
        const classDoc = await Class.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(classDoc);
    } catch (err) {
        res.status(500).json({ message: 'Error updating class' });
    }
});

router.delete('/classes/:id', async (req, res) => {
    try {
        await Class.findByIdAndDelete(req.params.id);
        res.json({ message: 'Class deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting class' });
    }
});

// --- Subjects CRUD ---
router.post('/subjects', async (req, res) => {
    try {
        const { name } = req.body;
        const subject = new Subject({ name });
        await subject.save();
        res.status(201).json(subject);
    } catch (err) {
        res.status(500).json({ message: 'Error creating subject' });
    }
});

router.get('/subjects', async (req, res) => {
    try {
        const subjects = await Subject.find();
        res.json(subjects);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching subjects' });
    }
});

router.put('/subjects/:id', async (req, res) => {
    try {
        const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(subject);
    } catch (err) {
        res.status(500).json({ message: 'Error updating subject' });
    }
});

router.delete('/subjects/:id', async (req, res) => {
    try {
        await Subject.findByIdAndDelete(req.params.id);
        res.json({ message: 'Subject deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting subject' });
    }
});

// --- TeacherAssignment CRUD ---
router.post('/assignments', async (req, res) => {
    try {
        const { teacherId, classId, subjectId } = req.body;
        const assignment = new TeacherAssignment({ teacherId, classId, subjectId });
        await assignment.save();
        res.status(201).json(assignment);
    } catch (err) {
        res.status(500).json({ message: 'Error creating assignment' });
    }
});

router.get('/assignments', async (req, res) => {
    try {
        const assignments = await TeacherAssignment.find().populate('teacherId classId subjectId');
        res.json(assignments);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching assignments' });
    }
});

router.delete('/assignments/:id', async (req, res) => {
    try {
        await TeacherAssignment.findByIdAndDelete(req.params.id);
        res.json({ message: 'Assignment deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting assignment' });
    }
});

// --- Classification Trigger ---
router.post('/classify', async (req, res) => {
    try {
        // Remove previous classifications
        await Classification.deleteMany({});
        const students = await Student.find().populate('previousMarks.subjectId');
        let count = 0;
        for (const student of students) {
            for (const mark of student.previousMarks) {
                const category = classifyMark(mark.marks);
                await Classification.create({
                    studentId: student._id,
                    subjectId: mark.subjectId._id || mark.subjectId,
                    category
                });
                count++;
            }
        }
        res.json({ message: `Classification completed for ${count} student-subject pairs.` });
    } catch (err) {
        res.status(500).json({ message: 'Error during classification' });
    }
});

// --- Test Route ---
router.post('/test', (req, res) => {
    console.log('Test route hit:', req.body);
    res.json({ message: 'Test route working', body: req.body });
});

module.exports = router;
