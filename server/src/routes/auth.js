import express from "express";
import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { clearAuthCookie, requireAuth, setAuthCookie, signToken } from "../auth.js";

export const authRouter = express.Router();

// Beginner-friendly fallback (when MongoDB is not connected).
// Data resets when you restart the server.
const memoryUsers = new Map(); // email -> { id, name, email, passwordHash }

authRouter.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body || {};

    if (!name || typeof name !== "string") return res.status(400).json({ error: "name is required" });
    if (!email || typeof email !== "string") return res.status(400).json({ error: "email is required" });
    if (!password || typeof password !== "string" || password.length < 6) {
      return res.status(400).json({ error: "password must be 6+ characters" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const dbConnected = User?.db?.readyState === 1;
    if (!dbConnected) {
      if (memoryUsers.has(normalizedEmail)) {
        return res.status(409).json({ error: "Email already registered" });
      }
      const passwordHash = await bcrypt.hash(password, 10);
      const id = String(Date.now());
      const user = { id, name: name.trim(), email: normalizedEmail, passwordHash };
      memoryUsers.set(normalizedEmail, user);

      const token = signToken({ userId: id, email: user.email, name: user.name });
      setAuthCookie(res, token);
      return res.json({ user: { id, name: user.name, email: user.email } });
    }

    const existing = await User.findOne({ email: normalizedEmail }).lean();
    if (existing) return res.status(409).json({ error: "Email already registered" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash
    });

    const token = signToken({ userId: user._id.toString(), email: user.email, name: user.name });
    setAuthCookie(res, token);
    return res.json({ user: { id: user._id.toString(), name: user.name, email: user.email } });
  } catch (err) {
    return res.status(500).json({ error: err?.message || "Server error" });
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || typeof email !== "string") return res.status(400).json({ error: "email is required" });
    if (!password || typeof password !== "string") return res.status(400).json({ error: "password is required" });

    const normalizedEmail = email.toLowerCase().trim();

    const dbConnected = User?.db?.readyState === 1;
    if (!dbConnected) {
      const user = memoryUsers.get(normalizedEmail);
      if (!user) return res.status(401).json({ error: "Invalid email or password" });

      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) return res.status(401).json({ error: "Invalid email or password" });

      const token = signToken({ userId: user.id, email: user.email, name: user.name });
      setAuthCookie(res, token);
      return res.json({ user: { id: user.id, name: user.name, email: user.email } });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(401).json({ error: "Invalid email or password" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid email or password" });

    const token = signToken({ userId: user._id.toString(), email: user.email, name: user.name });
    setAuthCookie(res, token);
    return res.json({ user: { id: user._id.toString(), name: user.name, email: user.email } });
  } catch (err) {
    return res.status(500).json({ error: err?.message || "Server error" });
  }
});

authRouter.post("/logout", (req, res) => {
  clearAuthCookie(res);
  return res.json({ ok: true });
});

authRouter.get("/me", requireAuth, async (req, res) => {
  return res.json({ user: req.user });
});

