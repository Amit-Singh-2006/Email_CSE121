import { Router } from "express";
import { dispatchEmails } from "../queues/worker.service";

export const communicationRouter = Router();

communicationRouter.post("/send", async (req, res) => {
  const { audience, channels, message, templateId } = req.body;
  
  // Example Authentication constraint extracted from Headers (Tenant ID)
  const tenantId = req.headers["x-tenant-id"] || "tenant_mock_123";

  // Simulate Database Fetch for Target Audience
  const mockStudents = audience === "at-risk" 
    ? [{ parentEmail: "parent1@test.com", name: "Alex" }, { parentEmail: "parent2@test.com", name: "Sarah" }]
    : [{ parentEmail: "all@test.com", name: "Batch" }];

  // Dispatch to background queue
  try {
    const jobs = mockStudents.map(s => ({
      tenantId,
      templateId,
      parentEmail: s.parentEmail,
      studentData: s,
      channels
    }));

    const jobId = await dispatchEmails(jobs);

    return res.status(202).json({
      status: "queued",
      message: `Enqueued ${mockStudents.length} messages for dispatch in background worker.`,
      jobId
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to dispatch queue" });
  }
});
