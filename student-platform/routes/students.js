const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { sendAIStudentReport } = require('../services/email');
const { sendAttendanceAlert } = require('../services/whatsapp');

// GET /api/students
router.get('/', async (req, res) => {
  try {
    const { risk, minAttendance, maxAttendance, minCgpa, maxCgpa } = req.query;
    const where = {
      isActive: true,
      ...(risk && { riskCategory: risk }),
      ...((minAttendance || maxAttendance) && { attendance: { ...(minAttendance && { gte: parseFloat(minAttendance) }), ...(maxAttendance && { lte: parseFloat(maxAttendance) }) } }),
      ...((minCgpa || maxCgpa) && { cgpa: { ...(minCgpa && { gte: parseFloat(minCgpa) }), ...(maxCgpa && { lte: parseFloat(maxCgpa) }) } })
    };
    const students = await prisma.student.findMany({
      where,
      include: { department: true, semesterRecords: { orderBy: { semester: 'desc' }, take: 1, include: { subjects: true } } },
      orderBy: { name: 'asc' }
    });
    const formatted = students.map(s => ({
      id: s.id, name: s.name, rollNumber: s.rollNumber,
      parentPhone: s.parentPhone, parentEmail: s.parentEmail, parentName: s.parentName,
      department: s.department?.name, semester: s.currentSemester,
      attendance: s.attendance, cgpa: s.cgpa, riskCategory: s.riskCategory,
      subjects: s.semesterRecords[0]?.subjects?.map(sub => ({ name: sub.subjectName, ca: sub.caMarks, mid: sub.midtermMarks, end: sub.endtermMarks, total: sub.totalMarks })) || []
    }));
    res.json({ success: true, count: formatted.length, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/students/search
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json({ success: true, data: [] });
    const students = await prisma.student.findMany({
      where: { isActive: true, OR: [{ name: { contains: q, mode: 'insensitive' } }, { rollNumber: { contains: q, mode: 'insensitive' } }] },
      include: { department: true }, take: 20
    });
    res.json({ success: true, data: students });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/students/:id
router.get('/:id', async (req, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: req.params.id },
      include: {
        department: true,
        mentor: { select: { id: true, name: true, email: true } },
        semesterRecords: { orderBy: { semester: 'asc' }, include: { subjects: true } },
        mentorNotes: { where: { isPrivate: false }, orderBy: { createdAt: 'desc' }, take: 5 },
        commLogs: { orderBy: { createdAt: 'desc' }, take: 10 }
      }
    });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    res.json({ success: true, data: student });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/students
router.post('/', async (req, res) => {
  try {
    const student = await prisma.student.create({
      data: {
        name: req.body.name, email: req.body.email || null,
        rollNumber: req.body.rollNumber, tenantId: req.body.tenantId,
        departmentId: req.body.departmentId,
        parentName: req.body.parentName || null, parentEmail: req.body.parentEmail || null,
        parentPhone: req.body.parentPhone || null,
        attendance: parseFloat(req.body.attendance) || 0,
        cgpa: parseFloat(req.body.cgpa) || 0,
        batch: parseInt(req.body.batch) || new Date().getFullYear(),
        currentSemester: parseInt(req.body.semester) || 1,
      },
      include: { department: true }
    });
    res.status(201).json({ success: true, data: student });
  } catch (error) {
    if (error.code === 'P2002') return res.status(400).json({ success: false, message: 'Roll number already exists' });
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/students/:id
router.put('/:id', async (req, res) => {
  try {
    const student = await prisma.student.update({ where: { id: req.params.id }, data: req.body });
    res.json({ success: true, data: student });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/students/:id/send-report
router.post('/:id/send-report', async (req, res) => {
  try {
    const tone = (req.body && req.body.tone) ? req.body.tone : 'supportive';
    const student = await prisma.student.findUnique({
      where: { id: req.params.id },
      include: { department: true, semesterRecords: { orderBy: { semester: 'desc' }, take: 1, include: { subjects: true } } }
    });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    if (!student.parentEmail) return res.status(400).json({ success: false, message: 'No parent email on file' });

    const studentData = {
      name: student.name, rollNumber: student.rollNumber,
      parentName: student.parentName, parentEmail: student.parentEmail,
      department: student.department?.name, semester: student.currentSemester,
      cgpa: student.cgpa, attendance: student.attendance, riskCategory: student.riskCategory,
      subjects: student.semesterRecords[0]?.subjects?.map(s => ({ name: s.subjectName, ca: s.caMarks, mid: s.midtermMarks, end: s.endtermMarks, total: s.totalMarks })) || []
    };

    const result = await sendAIStudentReport(studentData, tone);

    if (result.success) {
      await prisma.communicationLog.create({
        data: { tenantId: student.tenantId, studentId: student.id, channel: 'EMAIL', type: 'ai_academic_report', recipient: student.parentEmail, status: 'SENT', messageId: result.messageId || null, sentAt: new Date() }
      });
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/students/:id/send-whatsapp
router.post('/:id/send-whatsapp', async (req, res) => {
  try {
    const student = await prisma.student.findUnique({ where: { id: req.params.id } });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    if (!student.parentPhone) return res.status(400).json({ success: false, message: 'No parent phone on file' });

    const result = await sendAttendanceAlert(student.parentPhone, student.name, student.rollNumber, student.attendance);

    if (result.success) {
      await prisma.communicationLog.create({
        data: { tenantId: student.tenantId, studentId: student.id, channel: 'WHATSAPP', type: 'attendance_alert', recipient: student.parentPhone, status: 'SENT', messageId: result.data?.messages?.[0]?.id || null, sentAt: new Date() }
      });
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/students/:id/notes
router.post('/:id/notes', async (req, res) => {
  try {
    const note = await prisma.mentorNote.create({
      data: { studentId: req.params.id, note: req.body.note, isPrivate: req.body.isPrivate || false }
    });
    res.status(201).json({ success: true, data: note });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;