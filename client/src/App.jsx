import React, { useEffect, useRef, useState } from "react";
import md5 from "blueimp-md5";

const API_URL = "https://ai-chat-app-1x12.onrender.com";

async function apiFetch(path, options) {
  const res = await fetch(API_URL + path, { 
    credentials: "include", 
    ...options 
  });
  const data = await res.json().catch(() => ({}));
  return { res, data };
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error(data?.error || "Auth failed");
      onAuthed(data.user);
    } catch (err) {
      setError(err?.message || "Auth failed");
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
            <input
              className="input"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          )}
          <input
            className="input"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="input"
            placeholder="Password (min 6 chars)"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <input
              type="checkbox"
              checked={showPassword}
              onChange={(e) => setShowPassword(e.target.checked)}
            />
            Show password
          </label>

          {error && <div className="auth-error">{error}</div>}

          <button className="btn" disabled={loading}>
            {loading ? "Please wait…" : mode === "register" ? "Register" : "Login"}
          </button>
        </form>

        <div className="auth-switch">
          {mode === "register" ? "Already have an account?" : "New here?"}{" "}
          <button
            type="button"
            className="linkbtn"
            onClick={() => setMode(mode === "register" ? "login" : "register")}
            disabled={loading}
          >
            {mode === "register" ? "Login" : "Create one"}
          </button>
        </div>
      </div>
    </main>
  );
}

function Bubble({ role, content, avatarUrl }) {
  const isUser = role === "user";
  return (
    <div className={"row " + (isUser ? "row-user" : "row-ai")}>
      <div className={"bubble-wrap " + (isUser ? "bubble-wrap-user" : "bubble-wrap-ai")}>
        <img
          className={"avatar " + (isUser ? "avatar-user" : "avatar-ai")}
          src={avatarUrl}
          alt={isUser ? "Your avatar" : "AI avatar"}
          loading="lazy"
        />
        <div className={"bubble " + (isUser ? "bubble-user" : "bubble-ai")}>
          <div className="meta">{isUser ? "You" : "AI"}</div>
          <div className="text">{content}</div>
        </div>
      </div>
    </div>
  );
}

const QUICK_PROMPTS = ["What is JWT?", "Capital of India", "Explain MERN stack", "How does React useState work?"];

export default function App() {
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    async function loadMe() {
      try {
        const { res, data } = await apiFetch("/api/auth/me");
        if (res.ok && data?.user) setUser(data.user);
      } catch {}
    }
    loadMe();
  }, []);

  useEffect(() => {
    if (user) setMessages([]);
  }, [user]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, loading]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setLoading(true);
    setMessages((prev) => [...prev, { role: "user", content: text }]);

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const { res, data } = await apiFetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history })
      });

      if (!res.ok) throw new Error(data?.error || "Request failed");
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error: " + (err?.message || "Cannot connect to server") }
      ]);
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  async function logout() {
    await apiFetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setUser(null);
    setMessages([]);
    setAuthMode("login");
  }

  const userAvatar = user?.email ? gravatarUrl(user.email, 64) : "";
  const aiAvatar = "https://www.gravatar.com/avatar/?d=mp&s=64";

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">
          <div className="title">AI Chat App</div>
          <div className="subtitle">Ask anything and get instant answers.</div>
        </div>
        <div className="top-actions">
          {user && (
            <>
              <div className="whoami" title={user.email}>
                <img className="whoami-avatar" src={userAvatar} alt="Avatar" loading="lazy" />
                <div className="whoami-text">{user.name}</div>
              </div>
              <button className="btn btn-secondary" onClick={() => setMessages([])} disabled={loading}>
                Clear
              </button>
              <button className="btn btn-secondary" onClick={logout} disabled={loading}>
                Logout
              </button>
            </>
          )}
        </div>
      </header>

      {!user ? (
        <AuthCard mode={authMode} setMode={setAuthMode} onAuthed={(u) => { setUser(u); setMessages([]); }} />
      ) : (
        <main className="card">
          <div className="chat-top">
            <div className="chat-top-title">New Chat</div>
            <div className="chat-top-subtitle">Fast, clean and focused responses</div>
          </div>

          <div className="messages" ref={listRef}>
            {messages.length === 0 ? (
              <>
                <div className="empty">Type your question and press <b>Enter</b>.</div>
                <div className="quick-grid">
                  {QUICK_PROMPTS.map((prompt) => (
                    <button key={prompt} className="quick-chip" onClick={() => setInput(prompt)}>
                      {prompt}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              messages.map((m, idx) => (
                <Bubble
                  key={idx}
                  role={m.role}
                  content={m.content}
                  avatarUrl={m.role === "user" ? userAvatar : aiAvatar}
                />
              ))
            )}
            {loading && (
              <div className="row row-ai">
                <div className="bubble-wrap bubble-wrap-ai">
                  <img className="avatar avatar-ai" src={aiAvatar} alt="AI avatar" loading="lazy" />
                  <div className="bubble bubble-ai">
                    <div className="meta">AI</div>
                    <div className="text">Thinking…</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="composer">
            <textarea
              className="input"
              placeholder="Write a message…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              rows={2}
            />
            <button className="btn" onClick={send} disabled={loading || !input.trim()}>
              {loading ? "Sending..." : "Send"}
            </button>
          </div>
        </main>
      )}

      <footer className="footer">
        Backend: <code>{API_URL}</code>
      </footer>
    </div>
  );
}