import "dotenv/config";
import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import { connectDb } from "./db.js";
import { authRouter } from "./routes/auth.js";
import { chatRouter } from "./routes/chat.js";

const app = express();

// BEST CORS CONFIG FOR VERCEL + RENDER
app.use(cors({
  origin: true,   // Allow all for now (we can tighten later)
  credentials: true
}));

app.use(cookieParser());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ ok: true, message: "Backend is live" });
});

app.use("/api/auth", authRouter);
app.use("/api/chat", chatRouter);

await connectDb();

const port = Number(process.env.PORT || 5000);
app.listen(port, () => {
  console.log(`✅ Server is running on port ${port}`);
});