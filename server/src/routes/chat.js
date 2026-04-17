import express from "express";
import { generateAiReply } from "../ai.js";
import { requireAuth } from "../auth.js";

export const chatRouter = express.Router();

chatRouter.use(requireAuth);

chatRouter.post("/", async (req, res) => {
  try {
    const { message, history } = req.body || {};

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "message is required (string)" });
    }

    const reply = await generateAiReply({ history, message });

    return res.json({ reply });
  } catch (err) {
    return res.status(500).json({ error: err?.message || "Server error" });
  }
});

chatRouter.get("/recent", async (_req, res) => {
  // Privacy-first behavior: never return previous chat history.
  return res.json({ messages: [] });
});

