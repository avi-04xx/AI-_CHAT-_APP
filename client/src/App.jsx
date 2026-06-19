import React, { useEffect, useRef, useState } from "react";
import md5 from "blueimp-md5";

const API_URL = "https://ai-chat-app-1x12.onrender.com";

async function apiFetch(path, options = {}) {
  try {
    const res = await fetch(API_URL + path, {
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    const data = await res.json().catch(() => ({}));
    return { res, data };
  } catch (err) {
    console.error("Fetch error:", err);
    return { res: { ok: false }, data: { error: "Failed to fetch" } };
  }
}

function gravatarUrl(email, size = 64) {
  const normalized = String(email || "").trim().toLowerCase();
  const hash = md5(normalized);
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon&r=g`;
}

function AuthCard({ mode, setMode, onAuthed }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const path = mode === "register" ? "/api/auth/register" : "/api/auth/login";
      const payload = mode === "register" ? { name, email, password } : { email, password };

      const { res, data } = await apiFetch(path, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(data?.error || "Failed to fetch");
      onAuthed(data.user);
    } catch (err) {
      setError(err?.message || "Failed to fetch");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="card auth-card">
      <div className="auth-inner">
        <div className="auth-title">{mode === "register" ? "Create account" : "Login"}</div>
        <div className="auth-subtitle">Chat is available after login.</div>

        <form className="auth-form" onSubmit={submit}>
          {mode === "register" && (
            <input className="input" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
          )}
          <input className="input" placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input className="input" placeholder="Password (min 6 chars)" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />

          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <input type="checkbox" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} />
            Show password
          </label>

          {error && <div className="auth-error">{error}</div>}

          <button className="btn" disabled={loading}>
            {loading ? "Please wait…" : mode === "register" ? "Register" : "Login"}
          </button>
        </form>

        <div className="auth-switch">
          {mode === "register" ? "Already have an account?" : "New here?"}{" "}
          <button type="button" className="linkbtn" onClick={() => setMode(mode === "register" ? "login" : "register")} disabled={loading}>
            {mode === "register" ? "Login" : "Create one"}
          </button>
        </div>
      </div>
    </main>
  );
}

// Rest of the App component remains the same as previous full version
// (Bubble, QUICK_PROMPTS, main App function, etc.)

// ... [I kept it short here to save space, but use the full App.jsx from my earlier message]

export default App; // Make sure this is at the end