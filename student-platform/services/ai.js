const Groq = require('groq-sdk');
require('dotenv').config();

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

// ─── Generate personalized parent message ─────────────────────────────────────
async function generateParentMessage(student, tone = 'supportive') {
    const toneInstructions = {
        formal: 'Write in a formal, professional tone.',
        supportive: 'Write in a warm, supportive and encouraging tone.',
        urgent: 'Write in a serious, urgent tone emphasizing immediate action needed.'
    };

    const prompt = `
You are an academic advisor writing a message to a parent about their child's performance.

Student Details:
- Name: ${student.name}
- Department: ${student.department}
- Semester: ${student.semester}
- CGPA: ${student.cgpa}/10
- Attendance: ${student.attendance}%
- Risk Level: ${student.riskCategory}
${student.subjects ? `- Weak Subjects: ${student.subjects.filter(s => s.total < 60).map(s => s.name).join(', ')}` : ''}
${student.mentorNote ? `- Mentor Note: ${student.mentorNote}` : ''}

Instructions:
- ${toneInstructions[tone]}
- Write exactly 3 sentences.
- Be specific about the numbers (attendance %, CGPA).
- End with one clear actionable recommendation.
- Do NOT use generic phrases like "I hope this message finds you well".
- Address the parent directly.
- Do NOT include subject/greeting lines.

Write only the message body, nothing else.
`;

    const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
        temperature: 0.7
    });

    return response.choices[0].message.content.trim();
}

// ─── Generate subject-wise recommendations ────────────────────────────────────
async function generateSubjectRecommendations(student) {
    if (!student.subjects || student.subjects.length === 0) return [];

    const weakSubjects = student.subjects.filter(s => s.total < 60);
    if (weakSubjects.length === 0) return [];

    const prompt = `
A student named ${student.name} is struggling in these subjects:
${weakSubjects.map(s => `- ${s.name}: ${s.total}/100`).join('\n')}

For each subject, give ONE specific study tip in max 15 words.
Respond in JSON format only, like this:
[{"subject": "DBMS", "tip": "Practice ER diagrams and normalization with past papers daily"}]
No extra text, just the JSON array.
`;

    const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300,
        temperature: 0.5
    });

    try {
        const text = response.choices[0].message.content.trim();
        return JSON.parse(text);
    } catch {
        return [];
    }
}

// ─── Generate full AI-enhanced email content ──────────────────────────────────
async function generateAIEmailContent(student, tone = 'supportive') {
    const [parentMessage, recommendations] = await Promise.all([
        generateParentMessage(student, tone),
        generateSubjectRecommendations(student)
    ]);

    return { parentMessage, recommendations };
}

// ─── Classify student risk using AI ───────────────────────────────────────────
async function classifyStudentRisk(student) {
    const prompt = `
Based on this student data, classify the dropout risk as: LOW, MEDIUM, HIGH, or CRITICAL.
- CGPA: ${student.cgpa}/10
- Attendance: ${student.attendance}%
- CGPA trend: ${student.cgpaTrend || 'unknown'}
Respond with JSON only: {"risk": "HIGH", "reason": "one sentence reason"}
`;

    const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 100,
        temperature: 0.3
    });

    try {
        return JSON.parse(response.choices[0].message.content.trim());
    } catch {
        return { risk: 'UNKNOWN', reason: 'Could not classify' };
    }
}

module.exports = {
    generateParentMessage,
    generateSubjectRecommendations,
    generateAIEmailContent,
    classifyStudentRisk
};