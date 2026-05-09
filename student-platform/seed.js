require('dotenv').config();
const prisma = require('./lib/prisma');

async function seed() {
    console.log('🌱 Seeding database...\n');

    // 1. Create Tenant
    const tenant = await prisma.tenant.upsert({
        where: { slug: 'lpu' },
        update: {},
        create: {
            name: 'Lovely Professional University',
            slug: 'lpu',
            email: 'admin@lpu.in',
            phone: '+911824517000',
            address: 'Phagwara, Punjab, India'
        }
    });
    console.log(`✅ Tenant: ${tenant.name}`);

    // 2. Create Department
    const dept = await prisma.department.upsert({
        where: { tenantId_code: { tenantId: tenant.id, code: 'CS' } },
        update: {},
        create: {
            name: 'Computer Science & Engineering',
            code: 'CS',
            tenantId: tenant.id
        }
    });
    console.log(`✅ Department: ${dept.name}`);

    // 3. Create Mentor/Admin User
    const mentor = await prisma.user.upsert({
        where: { email: 'amit.panwar2k6@gmail.com' },
        update: {},
        create: {
            name: 'Amit Singh Panwar',
            email: 'amit.panwar2k6@gmail.com',
            password: 'hashed_password_here',  // hash this properly later
            role: 'MENTOR',
            tenantId: tenant.id,
            departmentId: dept.id
        }
    });
    console.log(`✅ User/Mentor: ${mentor.name}`);

    // 4. Create Test Students
    const students = [
        {
            name: 'Rahul Sharma',
            rollNumber: 'CS2024001',
            parentName: 'Mr. Sharma',
            parentEmail: 'amit.panwar2k6@gmail.com', // using your email for testing
            parentPhone: '+917877076804',             // your test number
            attendance: 68.5,
            cgpa: 7.2,
            riskCategory: 'AT_RISK',
            batch: 2024,
            currentSemester: 4
        },
        {
            name: 'Priya Patel',
            rollNumber: 'CS2024002',
            parentName: 'Mrs. Patel',
            parentEmail: 'amit.panwar2k6@gmail.com',
            parentPhone: '+917877076804',
            attendance: 55.0,
            cgpa: 6.1,
            riskCategory: 'CRITICAL',
            batch: 2024,
            currentSemester: 4
        },
        {
            name: 'Arjun Singh',
            rollNumber: 'CS2024003',
            parentName: 'Mr. Singh',
            parentEmail: 'amit.panwar2k6@gmail.com',
            parentPhone: '+917877076804',
            attendance: 88.0,
            cgpa: 8.9,
            riskCategory: 'ON_TRACK',
            batch: 2024,
            currentSemester: 4
        }
    ];

    for (const s of students) {
        const student = await prisma.student.upsert({
            where: { tenantId_rollNumber: { tenantId: tenant.id, rollNumber: s.rollNumber } },
            update: {},
            create: {
                ...s,
                tenantId: tenant.id,
                departmentId: dept.id,
                mentorId: mentor.id
            }
        });
        console.log(`✅ Student: ${student.name} (${student.rollNumber}) — ${student.riskCategory}`);

        // Add semester record with subjects
        const semRecord = await prisma.semesterRecord.upsert({
            where: {
                studentId_semester_academicYear: {
                    studentId: student.id,
                    semester: 4,
                    academicYear: '2024-25'
                }
            },
            update: {},
            create: {
                studentId: student.id,
                semester: 4,
                academicYear: '2024-25',
                tgpa: s.cgpa,
                cgpa: s.cgpa,
                attendance: s.attendance,
                subjects: {
                    create: [
                        { subjectName: 'Data Structures', subjectCode: 'CS301', caMarks: 18, midtermMarks: 22, endtermMarks: 45, totalMarks: 85, maxMarks: 100 },
                        { subjectName: 'DBMS', subjectCode: 'CS302', caMarks: 15, midtermMarks: 18, endtermMarks: 38, totalMarks: 71, maxMarks: 100 },
                        { subjectName: 'Operating Systems', subjectCode: 'CS303', caMarks: 12, midtermMarks: 20, endtermMarks: 40, totalMarks: 72, maxMarks: 100 },
                    ]
                }
            }
        });
        console.log(`   📚 Semester record created for sem ${semRecord.semester}`);
    }

    console.log('\n🎉 Seeding complete!');
    console.log(`\nTenant ID: ${tenant.id}`);
    console.log('Add this to your .env:');
    console.log(`DEFAULT_TENANT_ID=${tenant.id}`);
}

seed()
    .catch(console.error)
    .finally(() => prisma.$disconnect());