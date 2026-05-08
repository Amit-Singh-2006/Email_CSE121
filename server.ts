import "dotenv/config"; // Must be first — loads .env before any env vars are read
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import { uploadRouter } from "./src/server/routes/upload.routes";
import { communicationRouter } from "./src/server/routes/communications.routes";
import { startSchedulers } from "./src/server/scheduler/report.scheduler";
import { queueBulkReports } from "./src/server/queues/email.worker";

// ── Mock student data (replace with Prisma later) ───────────────────────────
const mockStudents = [
  {
    id: 1,
    name: "Rahul Sharma",
    rollNumber: "CS2024001",
    parentPhone: "+917877076804",
    parentEmail: "amit.panwar2k6@gmail.com",
    parentName: "Mr. Sharma",
    department: "Computer Science",
    semester: 4,
    attendance: 68,
    cgpa: 7.2,
    subjects: [
      { name: "Data Structures", ca: 18, mid: 22, end: 45, total: 85 },
      { name: "DBMS", ca: 15, mid: 18, end: 38, total: 71 },
    ],
    mentorNote: "Needs improvement in attendance.",
  },
];

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Global Middlewares
  app.use(express.json({ limit: "5mb" }));
  app.use(express.urlencoded({ extended: true }));

  // ==========================================
  // ENTERPRISE API ROUTES
  // ==========================================
  app.use("/api/v1/students", uploadRouter);
  app.use("/api/v1/communications", communicationRouter);

  // ── /api/students — convenience routes (mirrors student-platform) ──────────
  app.get("/api/students", (_req, res) => {
    res.json({ success: true, count: mockStudents.length, data: mockStudents });
  });

  app.get("/api/students/:id", (req, res) => {
    const student = mockStudents.find((s) => s.id === parseInt(req.params.id));
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });
    res.json({ success: true, data: student });
  });

  // POST /api/students/:id/send-report — send email report via Brevo
  app.post("/api/students/:id/send-report", async (req, res) => {
    const student = mockStudents.find((s) => s.id === parseInt(req.params.id));
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    const BREVO_URL = "https://api.brevo.com/v3/smtp/email";
    const attendanceColor =
      student.attendance < 60 ? "#dc2626" : student.attendance < 75 ? "#f59e0b" : "#16a34a";

    const htmlContent = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  body{font-family:Arial,sans-serif;margin:0;padding:0;background:#f3f4f6}
  .container{max-width:600px;margin:20px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,.1)}
  .header{background:#1e3a5f;color:#fff;padding:24px 32px}
  .header h1{margin:0;font-size:22px}
  .body{padding:32px}
  .stat{background:#f8fafc;border-left:4px solid ${attendanceColor};padding:16px 20px;border-radius:0 8px 8px 0;margin:16px 0}
  .stat-val{font-size:28px;font-weight:bold;color:${attendanceColor}}
  table{width:100%;border-collapse:collapse;margin:16px 0}
  th{background:#1e3a5f;color:#fff;padding:10px 14px;text-align:left;font-size:13px}
  td{padding:10px 14px;border-bottom:1px solid #e5e7eb;font-size:14px}
  .alert{background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin:16px 0;color:#991b1b;font-size:14px}
  .footer{background:#f8fafc;padding:20px 32px;text-align:center;font-size:12px;color:#9ca3af}
</style></head>
<body><div class="container">
  <div class="header"><h1>📊 Academic Performance Report</h1>
    <p>${new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}</p>
  </div>
  <div class="body">
    <p>Dear <strong>${student.parentName || "Parent/Guardian"}</strong>,</p>
    <div class="stat">
      <div style="font-size:18px;font-weight:bold;color:#1e3a5f">${student.name}</div>
      <div style="font-size:13px;color:#6b7280">Roll No: ${student.rollNumber} | ${student.department} | Sem ${student.semester}</div>
    </div>
    <div style="display:flex;gap:16px">
      <div class="stat" style="flex:1"><div style="font-size:12px;color:#6b7280;text-transform:uppercase">Attendance</div>
        <div class="stat-val">${student.attendance}%</div></div>
      <div class="stat" style="flex:1;border-color:#3b82f6"><div style="font-size:12px;color:#6b7280;text-transform:uppercase">CGPA</div>
        <div class="stat-val" style="color:#3b82f6">${student.cgpa}</div></div>
    </div>
    <h3 style="color:#1e3a5f;font-size:15px">Subject-wise Marks</h3>
    <table><thead><tr><th>Subject</th><th>CA</th><th>Mid</th><th>End</th><th>Total</th></tr></thead>
    <tbody>${student.subjects.map((s) => `<tr><td>${s.name}</td><td>${s.ca}</td><td>${s.mid}</td><td>${s.end}</td><td><strong>${s.total}</strong></td></tr>`).join("")}</tbody></table>
    ${student.attendance < 75 ? `<div class="alert">⚠️ <strong>Attendance Alert:</strong> Current attendance (${student.attendance}%) is below the required 75%.</div>` : ""}
    ${student.mentorNote ? `<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:16px 0;font-size:13px;color:#166534"><strong>📝 Mentor Note:</strong> ${student.mentorNote}</div>` : ""}
  </div>
  <div class="footer"><p>${process.env.COLLEGE_NAME || "Your College"} | Academic Reports System</p>
    <p>This is an automated message. Please do not reply.</p></div>
</div></body></html>`;

    try {
      const response = await axios.post(
        BREVO_URL,
        {
          sender: {
            name: process.env.EMAIL_SENDER_NAME || process.env.SENDER_NAME || "College Reports",
            email: process.env.EMAIL_SENDER_ADDRESS || process.env.SENDER_EMAIL,
          },
          to: [{ email: student.parentEmail, name: student.parentName }],
          subject: `Academic Report - ${student.name} | Semester ${student.semester}`,
          htmlContent,
        },
        {
          headers: {
            "api-key": process.env.BREVO_API_KEY || "",
            "Content-Type": "application/json",
          },
        }
      );
      console.log(`✅ Email sent to ${student.parentEmail}`);
      res.json({ success: true, messageId: response.data.messageId });
    } catch (err: any) {
      console.error(`❌ Email failed:`, err.response?.data);
      res.status(500).json({ success: false, error: err.response?.data || err.message });
    }
  });

  // POST /api/students/:id/send-whatsapp — send WhatsApp attendance alert
  app.post("/api/students/:id/send-whatsapp", async (req, res) => {
    const student = mockStudents.find((s) => s.id === parseInt(req.params.id));
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    const WA_URL = `https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
    try {
      const response = await axios.post(
        WA_URL,
        {
          messaging_product: "whatsapp",
          to: student.parentPhone.replace("+", ""),
          type: "template",
          template: {
            name: "attendance_alert",
            language: { code: "en_US" },
            components: [{
              type: "body",
              parameters: [
                { type: "text", text: student.name },
                { type: "text", text: student.rollNumber },
                { type: "text", text: String(student.attendance) },
              ],
            }],
          },
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log(`✅ WhatsApp alert sent to ${student.parentPhone}`);
      res.json({ success: true, data: response.data });
    } catch (err: any) {
      console.error(`❌ WhatsApp failed:`, err.response?.data);
      res.status(500).json({ success: false, error: err.response?.data || err.message });
    }
  });

  // Healthcheck & Metrics Endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", uptime: process.uptime(), memory: process.memoryUsage() });
  });

  // Analytics mock route (moved from inline)
  app.get("/api/v1/analytics/at-risk", (req, res) => {
    res.json({
      data: [
        { id: "S101X", name: "Alex Chen", riskScore: 88, reason: "Consecutive CGPA drops + 30% attendance in core modules" },
        { id: "S105Y", name: "Sarah Miller", riskScore: 72, reason: "Midterm failures in 2 subjects" }
      ]
    });
  });

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // ── Manual Test Trigger (dev only) ──────────────────────────────
  // POST /api/v1/communications/trigger-reports
  // Body: { "type": "at-risk" | "all" }
  app.post("/api/v1/communications/trigger-reports", async (req, res) => {
    const { type = "at-risk" } = req.body;
    try {
      // Import here to avoid circular deps
      const { fetchAtRiskStudents } = await import(
        "./src/server/scheduler/report.scheduler.js"
      ).then(() => ({
        fetchAtRiskStudents: async () => [
          {
            tenantId: "tenant_mock_123",
            student: {
              id: "S101", name: "Test Student", parentName: "Test Parent",
              parentEmail: req.body.testEmail || "test@example.com",
              attendancePercent: 62, cgpa: 5.8, department: "Computer Science",
            },
            reportData: {
              semester: 4,
              subjects: [{ name: "Data Structures", ca: 18, mid: 28, end: 55 }],
              aiSummary: "Test report triggered manually.",
            },
          },
        ],
      }));
      const jobs = await fetchAtRiskStudents();
      const batchId = await queueBulkReports(jobs);
      return res.json({ status: "triggered", type, jobCount: jobs.length, batchId });
    } catch (err: any) {
      return res.status(500).json({ error: "Trigger failed", details: err.message });
    }
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT} - Enterprise Mode`);
    startSchedulers(); // Start cron jobs after server is ready
  });
}

startServer();
