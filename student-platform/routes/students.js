const express = require('express');
const router = express.Router();
const { sendStudentReport } = require('../services/email');
const { sendAttendanceAlert } = require('../services/whatsapp');


// Mock data — replace with Prisma queries later
const students = [
  {
    id: 1,
    name: 'Rahul Sharma',
    rollNumber: 'CS2024001',
    parentPhone: '+917877076804',
    parentEmail: 'amit.panwar2k6@gmail.com',
    parentName: 'Mr. Sharma',
    department: 'Computer Science',
    semester: 4,
    attendance: 68,
    cgpa: 7.2,
    subjects: [
      { name: 'Data Structures', ca: 18, mid: 22, end: 45, total: 85 },
      { name: 'DBMS', ca: 15, mid: 18, end: 38, total: 71 },
    ],
    mentorNote: 'Needs improvement in attendance.'
  }
];

// GET /api/students — list all
router.get('/', (req, res) => {
  res.json({ success: true, count: students.length, data: students });
});

// GET /api/students/:id — single student
router.get('/:id', (req, res) => {
  const student = students.find(s => s.id === parseInt(req.params.id));
  if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
  res.json({ success: true, data: student });
});

// POST /api/students/:id/send-report — send email report
router.post('/:id/send-report', async (req, res) => {
  const student = students.find(s => s.id === parseInt(req.params.id));
  if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

  const result = await sendStudentReport(student);
  res.json(result);
});

// POST /api/students/:id/send-whatsapp — send WhatsApp alert
router.post('/:id/send-whatsapp', async (req, res) => {
  const student = students.find(s => s.id === parseInt(req.params.id));
  if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

  const result = await sendAttendanceAlert(
    student.parentPhone,
    student.name,
    student.rollNumber,
    student.attendance
  );
  res.json(result);
});

module.exports = router;