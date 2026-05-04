import cron from "node-cron";
import { queueBulkReports, EmailJobData } from "../queues/email.worker.js";

// ============================================================
// CRON SCHEDULER — Automated Report Triggers
// ============================================================
// Uses node-cron for scheduled tasks.
// In production: replace mock data queries with real Prisma DB calls.
//
// Cron expressions:
//   '0 8 * * 1'   → Every Monday at 8:00 AM
//   '0 9 1 * *'   → 1st of every month at 9:00 AM
//   '0 18 * * 5'  → Every Friday at 6:00 PM
// ============================================================

// ──────────────────────────────────────────────────────────────
// [MOCK] — Replace with your Prisma/DB query in production
// ──────────────────────────────────────────────────────────────
async function fetchAtRiskStudents(): Promise<EmailJobData[]> {
  // PRODUCTION EXAMPLE:
  // const students = await prisma.student.findMany({
  //   where: { academicRecords: { some: { attendancePercent: { lt: 75 } } } },
  //   include: { academicRecords: { orderBy: { semester: 'desc' }, take: 1 } }
  // });
  // return students.map(s => ({ tenantId: s.tenantId, student: s, reportData: s.academicRecords[0] }));

  console.log("[Scheduler] Querying at-risk students...");
  return [
    {
      tenantId: "tenant_mock_123",
      student: {
        id: "S101",
        name: "Alex Chen",
        parentName: "Mr. David Chen",
        parentEmail: "parent1@test.com",
        attendancePercent: 62,
        cgpa: 5.8,
        department: "Computer Science",
      },
      reportData: {
        semester: 4,
        subjects: [
          { name: "Data Structures", ca: 18, mid: 28, end: 55 },
          { name: "Operating Systems", ca: 12, mid: 22, end: 48 },
          { name: "Discrete Mathematics", ca: 20, mid: 30, end: 60 },
        ],
        aiSummary:
          "Alex's attendance has dropped critically below 75%. Immediate parental intervention recommended to discuss study habits and attendance.",
      },
    },
  ];
}

async function fetchAllStudents(): Promise<EmailJobData[]> {
  // PRODUCTION: return all students from DB for monthly reports
  console.log("[Scheduler] Querying all students for monthly reports...");
  return []; // Replace with real DB query
}

// ──────────────────────────────────────────────────────────────
// Job 1: Weekly At-Risk Alert — Every Monday at 8:00 AM
// ──────────────────────────────────────────────────────────────
export const weeklyAtRiskJob = cron.schedule(
  "0 8 * * 1",
  async () => {
    console.log("[Cron] ⏰ Weekly at-risk report trigger fired.");
    try {
      const jobs = await fetchAtRiskStudents();
      if (jobs.length === 0) {
        console.log("[Cron] No at-risk students found. Skipping.");
        return;
      }
      const batchId = await queueBulkReports(jobs);
      console.log(`[Cron] ✅ Queued ${jobs.length} at-risk alerts. Batch: ${batchId}`);
    } catch (err: any) {
      console.error("[Cron] ❌ Weekly job failed:", err.message);
    }
  },
  { scheduled: false } // Start manually via startSchedulers()
);

// ──────────────────────────────────────────────────────────────
// Job 2: Monthly Full Report — 1st of every month at 9:00 AM
// ──────────────────────────────────────────────────────────────
export const monthlyReportJob = cron.schedule(
  "0 9 1 * *",
  async () => {
    console.log("[Cron] ⏰ Monthly full-report trigger fired.");
    try {
      const jobs = await fetchAllStudents();
      if (jobs.length === 0) {
        console.log("[Cron] No students found. Skipping.");
        return;
      }
      const batchId = await queueBulkReports(jobs);
      console.log(`[Cron] ✅ Queued ${jobs.length} monthly reports. Batch: ${batchId}`);
    } catch (err: any) {
      console.error("[Cron] ❌ Monthly job failed:", err.message);
    }
  },
  { scheduled: false }
);

// ──────────────────────────────────────────────────────────────
// Start all schedulers — call this from server.ts
// ──────────────────────────────────────────────────────────────
export function startSchedulers(): void {
  weeklyAtRiskJob.start();
  monthlyReportJob.start();
  console.log("[Scheduler] ✅ Cron jobs started:");
  console.log("  → Weekly at-risk alerts  : Every Monday @ 08:00");
  console.log("  → Monthly full reports   : 1st of month @ 09:00");
}
