const express = require('express');
const router = express.Router();
const multer = require('multer');
const XLSX = require('xlsx');
const prisma = require('../lib/prisma');

// ─── Multer config — store in memory ──────────────────────────────────────────
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    fileFilter: (req, file, cb) => {
        const allowed = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'text/csv'
        ];
        if (allowed.includes(file.mimetype) || file.originalname.match(/\.(xlsx|xls|csv)$/)) {
            cb(null, true);
        } else {
            cb(new Error('Only Excel (.xlsx, .xls) and CSV files are allowed'));
        }
    }
});

// ─── POST /api/upload/students — upload + parse + save ────────────────────────
router.post('/students', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const { tenantId, departmentId, semester, academicYear = '2024-25' } = req.body;
    if (!tenantId || !departmentId) {
        return res.status(400).json({ success: false, message: 'tenantId and departmentId are required' });
    }

    // Create upload record
    const uploadRecord = await prisma.dataUpload.create({
        data: {
            tenantId,
            fileName: req.file.originalname,
            status: 'PROCESSING'
        }
    });

    try {
        // ── Parse Excel ───────────────────────────────────────────────────────────
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        if (rows.length === 0) {
            await prisma.dataUpload.update({
                where: { id: uploadRecord.id },
                data: { status: 'FAILED', errorLog: ['No data found in file'] }
            });
            return res.status(400).json({ success: false, message: 'File is empty' });
        }

        // ── Auto-map columns ──────────────────────────────────────────────────────
        const firstRow = rows[0];
        const columnMap = autoMapColumns(Object.keys(firstRow));
        console.log('📋 Column mapping:', columnMap);

        // ── Process rows ──────────────────────────────────────────────────────────
        const results = { success: 0, errors: [], skipped: 0 };

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowNum = i + 2; // Excel row number (1 = header)

            try {
                // Extract data using column map
                const studentData = extractStudentData(row, columnMap);

                // Validate required fields
                const validation = validateRow(studentData, rowNum);
                if (!validation.valid) {
                    results.errors.push(validation.error);
                    continue;
                }

                // Upsert student (create or update)
                const student = await prisma.student.upsert({
                    where: {
                        tenantId_rollNumber: {
                            tenantId,
                            rollNumber: studentData.rollNumber
                        }
                    },
                    update: {
                        name: studentData.name,
                        email: studentData.email || undefined,
                        parentName: studentData.parentName || undefined,
                        parentEmail: studentData.parentEmail || undefined,
                        parentPhone: studentData.parentPhone || undefined,
                        attendance: studentData.attendance,
                        cgpa: studentData.cgpa,
                        currentSemester: parseInt(semester) || studentData.semester || 1,
                        riskCategory: calculateRiskCategory(studentData.attendance, studentData.cgpa)
                    },
                    create: {
                        name: studentData.name,
                        email: studentData.email || null,
                        rollNumber: studentData.rollNumber,
                        tenantId,
                        departmentId,
                        parentName: studentData.parentName || null,
                        parentEmail: studentData.parentEmail || null,
                        parentPhone: studentData.parentPhone || null,
                        attendance: studentData.attendance,
                        cgpa: studentData.cgpa,
                        batch: studentData.batch || new Date().getFullYear(),
                        currentSemester: parseInt(semester) || 1,
                        riskCategory: calculateRiskCategory(studentData.attendance, studentData.cgpa)
                    }
                });

                // Create semester record if marks provided
                if (studentData.subjects && studentData.subjects.length > 0) {
                    await prisma.semesterRecord.upsert({
                        where: {
                            studentId_semester_academicYear: {
                                studentId: student.id,
                                semester: parseInt(semester) || 1,
                                academicYear
                            }
                        },
                        update: {
                            tgpa: studentData.cgpa,
                            cgpa: studentData.cgpa,
                            attendance: studentData.attendance
                        },
                        create: {
                            studentId: student.id,
                            semester: parseInt(semester) || 1,
                            academicYear,
                            tgpa: studentData.cgpa,
                            cgpa: studentData.cgpa,
                            attendance: studentData.attendance,
                            subjects: {
                                create: studentData.subjects
                            }
                        }
                    });
                }

                results.success++;

            } catch (rowError) {
                results.errors.push(`Row ${rowNum}: ${rowError.message}`);
            }
        }

        // ── Update upload record ──────────────────────────────────────────────────
        await prisma.dataUpload.update({
            where: { id: uploadRecord.id },
            data: {
                status: results.errors.length === rows.length ? 'FAILED' : 'COMPLETED',
                totalRows: rows.length,
                successRows: results.success,
                errorRows: results.errors.length,
                errorLog: results.errors.length > 0 ? results.errors : null,
                processedAt: new Date()
            }
        });

        console.log(`✅ Upload complete: ${results.success}/${rows.length} students processed`);

        res.json({
            success: true,
            summary: {
                totalRows: rows.length,
                successRows: results.success,
                errorRows: results.errors.length,
                skipped: results.skipped,
                columnMapping: columnMap
            },
            errors: results.errors
        });

    } catch (error) {
        await prisma.dataUpload.update({
            where: { id: uploadRecord.id },
            data: { status: 'FAILED', errorLog: [error.message] }
        });
        res.status(500).json({ success: false, error: error.message });
    }
});

// ─── GET /api/upload/history — upload history ─────────────────────────────────
router.get('/history', async (req, res) => {
    try {
        const uploads = await prisma.dataUpload.findMany({
            orderBy: { createdAt: 'desc' },
            take: 20
        });
        res.json({ success: true, data: uploads });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ─── GET /api/upload/template — download Excel template ───────────────────────
router.get('/template', (req, res) => {
    const templateData = [
        {
            'Student Name': 'Rahul Sharma',
            'Roll Number': 'CS2024001',
            'Email': 'rahul@example.com',
            'Parent Name': 'Mr. Sharma',
            'Parent Email': 'parent@example.com',
            'Parent Phone': '+917877076804',
            'Attendance %': 75,
            'CGPA': 7.5,
            'Batch': 2024,
            'CA Marks': 18,
            'Mid Marks': 22,
            'End Marks': 45
        }
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(templateData);

    // Set column widths
    ws['!cols'] = [
        { wch: 20 }, { wch: 15 }, { wch: 25 }, { wch: 20 },
        { wch: 25 }, { wch: 15 }, { wch: 12 }, { wch: 8 },
        { wch: 8 }, { wch: 10 }, { wch: 10 }, { wch: 10 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Students');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename=student_template.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
});

// ─── Helper: Auto-map column headers ──────────────────────────────────────────
function autoMapColumns(headers) {
    const map = {};
    const rules = {
        name: ['student name', 'name', 'student', 'full name', 'sname'],
        rollNumber: ['roll number', 'roll no', 'rollno', 'roll', 'registration', 'reg no', 'regno'],
        email: ['email', 'student email', 'mail'],
        parentName: ['parent name', 'father name', 'guardian name', 'parent'],
        parentEmail: ['parent email', 'father email', 'guardian email'],
        parentPhone: ['parent phone', 'phone', 'mobile', 'contact', 'parent mobile', 'father phone'],
        attendance: ['attendance', 'attendance %', 'att%', 'att', 'present %'],
        cgpa: ['cgpa', 'gpa', 'grade point', 'tgpa'],
        batch: ['batch', 'year', 'admission year'],
        semester: ['semester', 'sem'],
        caMarks: ['ca marks', 'ca', 'internal', 'cia'],
        midMarks: ['mid marks', 'midterm', 'mid', 'mid term'],
        endMarks: ['end marks', 'endterm', 'end', 'final', 'end term']
    };

    for (const header of headers) {
        const normalized = header.toLowerCase().trim();
        for (const [field, aliases] of Object.entries(rules)) {
            if (aliases.some(alias => normalized.includes(alias))) {
                if (!map[field]) map[field] = header; // use first match
            }
        }
    }

    return map;
}

// ─── Helper: Extract student data using column map ────────────────────────────
function extractStudentData(row, columnMap) {
    const get = (field) => {
        const col = columnMap[field];
        return col ? String(row[col] || '').trim() : '';
    };

    const getNum = (field, defaultVal = 0) => {
        const val = parseFloat(get(field));
        return isNaN(val) ? defaultVal : val;
    };

    const data = {
        name: get('name'),
        rollNumber: get('rollNumber'),
        email: get('email'),
        parentName: get('parentName'),
        parentEmail: get('parentEmail'),
        parentPhone: get('parentPhone'),
        attendance: getNum('attendance'),
        cgpa: getNum('cgpa'),
        batch: parseInt(get('batch')) || new Date().getFullYear(),
        semester: parseInt(get('semester')) || 1,
        subjects: []
    };

    // Add subject marks if available
    const ca = getNum('caMarks');
    const mid = getNum('midMarks');
    const end = getNum('endMarks');
    if (ca || mid || end) {
        data.subjects.push({
            subjectName: 'General',
            caMarks: ca,
            midtermMarks: mid,
            endtermMarks: end,
            totalMarks: ca + mid + end,
            maxMarks: 100
        });
    }

    return data;
}

// ─── Helper: Validate row ──────────────────────────────────────────────────────
function validateRow(data, rowNum) {
    if (!data.name) return { valid: false, error: `Row ${rowNum}: Missing student name` };
    if (!data.rollNumber) return { valid: false, error: `Row ${rowNum}: Missing roll number` };
    if (data.attendance < 0 || data.attendance > 100) return { valid: false, error: `Row ${rowNum}: Invalid attendance ${data.attendance}` };
    if (data.cgpa < 0 || data.cgpa > 10) return { valid: false, error: `Row ${rowNum}: Invalid CGPA ${data.cgpa}` };
    return { valid: true };
}

// ─── Helper: Calculate risk category ──────────────────────────────────────────
function calculateRiskCategory(attendance, cgpa) {
    if (attendance < 50 || cgpa < 4) return 'CRITICAL';
    if (attendance < 65 || cgpa < 5) return 'AT_RISK';
    if (attendance < 75 || cgpa < 7) return 'MONITOR';
    return 'ON_TRACK';
}

module.exports = router;