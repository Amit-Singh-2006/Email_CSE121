const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { generateAIEmailContent, classifyStudentRisk } = require('../services/ai');

// POST /api/ai/generate-message/:studentId
router.post('/generate-message/:studentId', async (req, res) => {
    try {
        const { tone = 'supportive' } = req.body;

        const student = await prisma.student.findUnique({
            where: { id: req.params.studentId },
            include: {
                department: true,
                semesterRecords: {
                    orderBy: { semester: 'desc' },
                    take: 1,
                    include: { subjects: true }
                }
            }
        });

        if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

        const studentData = {
            name: student.name,
            department: student.department?.name,
            semester: student.currentSemester,
            cgpa: student.cgpa,
            attendance: student.attendance,
            riskCategory: student.riskCategory,
            subjects: student.semesterRecords[0]?.subjects?.map(s => ({
                name: s.subjectName,
                total: s.totalMarks
            }))
        };

        const aiContent = await generateAIEmailContent(studentData, tone);
        res.json({ success: true, data: aiContent });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/ai/classify-risk/:studentId
router.post('/classify-risk/:studentId', async (req, res) => {
    try {
        const student = await prisma.student.findUnique({
            where: { id: req.params.studentId }
        });

        if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

        const result = await classifyStudentRisk(student);
        res.json({ success: true, data: result });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;