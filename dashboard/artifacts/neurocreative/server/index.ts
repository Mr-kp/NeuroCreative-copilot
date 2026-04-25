import "dotenv/config";
import express from "express";
import cors from "cors";
import analyzeUploadRouter from "./routes/analyzeUpload.js";
import askCopilotRouter from "./routes/askCopilot.js";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Routes
app.use("/api/analyze-creatives-upload", analyzeUploadRouter);
app.use("/api/ask-copilot", askCopilotRouter);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    model: process.env.OPENAI_MODEL || "gpt-4o",
    hasApiKey: !!process.env.OPENAI_API_KEY,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🧠 NeuroCreative API server running on http://localhost:${PORT}`);
  console.log(`   Model: ${process.env.OPENAI_MODEL || "gpt-4o"}`);
  console.log(`   API Key: ${process.env.OPENAI_API_KEY ? "✓ configured" : "✗ missing"}\n`);
});
