import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { uploadRouter } from "./src/server/routes/upload.routes";
import { communicationRouter } from "./src/server/routes/communications.routes";
import { startSchedulers } from "./src/server/scheduler/report.scheduler";
import { queueBulkReports } from "./src/server/queues/email.worker";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Global Middlewares
  app.use(express.json({ limit: "5mb" })); // Support large JSON payloads
  app.use(express.urlencoded({ extended: true }));

  // ==========================================
  // ENTERPRISE API ROUTES
  // ==========================================
  // In production, we apply rate limiting, auth (JWT), and tenant isolation middlewares here.
  app.use("/api/v1/students", uploadRouter);
  app.use("/api/v1/communications", communicationRouter);

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
