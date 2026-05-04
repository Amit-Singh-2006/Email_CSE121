import { Queue, Worker, Job } from "bullmq";
import IORedis from "ioredis";

// -------------------------------------------------------------
// ASYNCHRONOUS WORKER ARCHITECTURE (EVENT-DRIVEN)
// -------------------------------------------------------------
// In a true serverless environment, this could be swapped with
// AWS SQS + Lambda, or Upstash QStash. Here we design for standard Redis.

// Create a mock Redis config that won't crash if Redis is unavailable in Preview
const REDIS_MOCK = process.env.NODE_ENV !== "production";

let connection: any;
if (!REDIS_MOCK) {
  connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
    maxRetriesPerRequest: null,
  });
} else {
  // Mock Redis connection for AI Studio environment
  connection = { 
    on: () => {}, 
    status: 'ready' 
  };
}

// 1. Email Processing Queue
export const emailQueue = REDIS_MOCK ? null : new Queue("email-dispatches", { connection });

// 2. Report Generation Queue (PDFs)
export const reportQueue = REDIS_MOCK ? null : new Queue("pdf-generation", { connection });

// --- WORKERS ---
if (!REDIS_MOCK) {
  const emailWorker = new Worker(
    "email-dispatches",
    async (job: Job) => {
      console.log(`[EmailWorker] Processing job ${job.id}`);
      const { parentEmail, templateId, studentData } = job.data;
      
      // Simulate integrating with Brevo / AWS SES
      console.log(`Sending to ${parentEmail} using template ${templateId}`);
      // await brevoClient.sendEmail(...)
      
      // Artificial delay
      await new Promise(r => setTimeout(r, 1000));
      return { status: "sent", timestamp: new Date() };
    },
    { connection, concurrency: 10 } // Process 10 emails concurrently
  );

  emailWorker.on("completed", (job) => {
    console.log(`Job ${job.id} has completed!`);
  });

  emailWorker.on("failed", (job, err) => {
    console.error(`Job ${job?.id} has failed with ${err.message}`);
  });
}

// Exported Dispatcher functions
export const dispatchEmails = async (payloads: any[]) => {
  if (REDIS_MOCK) {
    console.log(`[MOCK QUEUE] Dispatching ${payloads.length} emails asynchronously.`);
    return "mock-job-id";
  }

  // Bulk add to BullMQ
  const jobs = payloads.map(p => ({
    name: "sendParentEmail",
    data: p,
    opts: { attempts: 3, backoff: { type: "exponential", delay: 2000 } }
  }));
  
  await emailQueue?.addBulk(jobs);
};
