import jwt from "jsonwebtoken";

const COOKIE_NAME = "token";

function getJwtSecret() {
  return process.env.JWT_SECRET || "super-secret-change-this-in-production-2026";
}

export function signToken(payload) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "30d" });
}

export function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 30 * 24 * 60 * 60 * 1000
  });
}

export function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME);
}

export function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.[COOKIE_NAME];
    if (!token) return res.status(401).json({ error: "Not logged in" });

    const decoded = jwt.verify(token, getJwtSecret());
    req.user = decoded;
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid session" });
  }
}