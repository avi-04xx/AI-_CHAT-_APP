import "dotenv/config";
import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import { connectDb } from "./db.js";
import { authRouter } from "./routes/auth.js";
import { chatRouter } from "./routes/chat.js";

const app = express();

// === FINAL STRONG CORS FIX ===
app.use(cors({
  origin: [
    "https://ai-chat-app-client-4knylzexn-avi-04xxs-projects.vercel.app",
    "https://ai-chat-app.vercel.app",
    "https://ai-chat-app-client-pearl.vercel.app",   // your current domain
    "http://localhost:5173"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(cookieParser());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", authRouter);
app.use("/api/chat", chatRouter);

await connectDb();

const port = Number(process.env.PORT || 5000);
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});