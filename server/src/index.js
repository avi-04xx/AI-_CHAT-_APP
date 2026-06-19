import "dotenv/config";
import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import { connectDb } from "./db.js";
import { authRouter } from "./routes/auth.js";
import { chatRouter } from "./routes/chat.js";

const app = express();

// FIXED CORS FOR VERCEL FRONTEND
app.use(
  cors({
    origin: [
      "https://ai-chat-app-client-4knylzexn-avi-04xxs-projects.vercel.app",
      "https://ai-chat-app.vercel.app",
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:3000"
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, message: "Backend is working" });
});

app.use("/api/auth", authRouter);
app.use("/api/chat", chatRouter);

await connectDb();

const port = Number(process.env.PORT || 5000);
const server = app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
});

server.on("error", (err) => {
  console.error("Server error:", err);
});