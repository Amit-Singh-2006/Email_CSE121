import { Queue, Worker, Job } from "bullmq";
import IORedis from "ioredis";
import { sendParentReport, StudentRecord, ReportData } from "../services/email.service.js";

// ============================================================
// EMAIL WORKER — BullMQ-based Background Queue
// ============================================================
// Uses BullMQ (the modern successor to bull) backed by Redis.
// In dev/preview environments, Redis is mocked so the server
// starts without crashing. In production, supply REDIS_URL.
// ============================================================

const IS_MOCK = process.env.NODE_ENV !== "production" && !process.env.REDIS_URL;

// ──────────────────────────────────────────────────────────────
// Redis Connection
// ──────────────────────────────────────────────────────────────
let connection: IORedis | null = null;

if (!IS_MOCK) {
  connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
    maxRetriesPerRequest: null,
  });
  connection.on("error", (err) =>
    console.error("[Redis] Connection error:", err.message)
  );
}

// ──────────────────────────────────────────────────────────────
// Queue Definition
// ──────────────────────────────────────────────────────────────
export interface EmailJobData {
  tenantId: string;
  student: StudentRecord;
  reportData: ReportData;
}

export const emailQueue = IS_MOCK
  ? null
  : new Queue<EmailJobData>("email-dispatches", {
      connection: connection!,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: { count: 100 }, // Keep last 100 completed jobs
        removeOnFail: { count: 50 },
      },
    });

// ──────────────────────────────────────────────────────────────
// Worker (Consumer)
// ──────────────────────────────────────────────────────────────
if (!IS_MOCK && connection) {
  const emailWorker = new Worker<EmailJobData>(
    "email-dispatches",
    async (job: Job<EmailJobData>) => {
      const { student, reportData } = job.data;
      console.log(`[EmailWorker] Processing job ${job.id} → ${student.parentEmail}`);

      await sendParentReport(student, reportData);

      return { status: "sent", timestamp: new Date().toISOString() };
    },
    {
      connection: connection!,
      concurrency: 5, // Send 5 emails in parallel at most
    }
  );

  emailWorker.on("completed", (job) => {
    console.log(`✅ Job ${job.id} completed — email sent to ${job.data.student.parentEmail}`);
  });

  emailWorker.on("failed", (job, err) => {
    console.error(`❌ Job ${job?.id} failed (attempt ${job?.attemptsMade}): ${err.message}`);
  });

  emailWorker.on("stalled", (jobId) => {
    console.warn(`⚠ Job ${jobId} stalled — will be retried.`);
  });
}

// ──────────────────────────────────────────────────────────────
// Dispatcher — add bulk jobs to the queue
// ──────────────────────────────────────────────────────────────
export async function queueBulkReports(
  jobs: EmailJobData[]
): Promise<string> {
  if (IS_MOCK) {
    console.log(`[MOCK QUEUE] Would dispatch ${jobs.length} email jobs.`);
    jobs.forEach((j, i) =>
      console.log(`  → [${i + 1}] ${j.student.name} → ${j.student.parentEmail}`)
    );
    return "mock-job-id-" + Date.now();
  }

  // Stagger sends: 500ms delay between each job to avoid SMTP rate limits
  const bulkJobs = jobs.map((data, index) => ({
    name: "sendParentReport",
    data,
    opts: {
      delay: index * 500,
    },
  }));

  await emailQueue!.addBulk(bulkJobs);
  console.log(`[EmailQueue] Enqueued ${jobs.length} email jobs.`);
  return `batch-${Date.now()}`;
}
