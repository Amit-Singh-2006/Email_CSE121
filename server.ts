import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { uploadRouter } from "./src/server/routes/upload.routes";
import { communicationRouter } from "./src/server/routes/communications.routes";

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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT} - Enterprise Mode`);
  });
}

startServer();
