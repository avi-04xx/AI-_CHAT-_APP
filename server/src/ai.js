function buildMessages(history, userMessage) {
  const safeHistory = Array.isArray(history) ? history : [];
  const priorMessages = safeHistory
    .filter((item) => {
      if (!item) return false;
      if (item.role !== "user" && item.role !== "assistant") return false;
      if (typeof item.content !== "string") return false;
      return true;
    })
    .slice(-20)
    .map((item) => ({ role: item.role, content: item.content }));

  priorMessages.push({ role: "user", content: String(userMessage ?? "") });
  return priorMessages;
}

function getApiKey() {
  const key = String(process.env.AI_API_KEY || "").trim();
  if (!key || key === "PASTE_YOUR_API_KEY_HERE") {
    return "";
  }
  return key;
}

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function normalizeQuestionText(value) {
  let text = cleanText(value).toLowerCase();
  text = text.replace(/[?!.]+$/g, "");
  text = text.replace(/\bcaptical\b/g, "capital");
  text = text.replace(/\bcapitol\b/g, "capital");
  text = text.replace(/\bcapitle\b/g, "capital");
  return text;
}

async function tryCountryCapitalAnswer(query) {
  const normalized = normalizeQuestionText(query);
  const match = normalized.match(/(?:what is|whats|tell me|give me)?\s*(?:the\s*)?capital\s+of\s+(.+)/i);
  if (!match) return "";

  const countryRaw = cleanText(match[1]).replace(/^the\s+/i, "");
  if (!countryRaw) return "";

  const candidates = [countryRaw, countryRaw.replace(/\s+/g, " ")];
  for (const country of candidates) {
    const endpoints = [
      `https://restcountries.com/v3.1/name/${encodeURIComponent(country)}?fullText=true`,
      `https://restcountries.com/v3.1/name/${encodeURIComponent(country)}`
    ];

    for (const endpoint of endpoints) {
      try {
        const res = await fetch(endpoint);
        if (!res.ok) continue;
        const data = await res.json();
        const first = Array.isArray(data) ? data[0] : null;
        const capital = first?.capital?.[0];
        const name = first?.name?.common || country;
        if (capital) {
          return `The capital of ${name} is ${capital}.`;
        }
      } catch {
        continue;
      }
    }
  }
  return "";
}

function tryMathAnswer(query) {
  const normalized = normalizeQuestionText(query);
  const expr = normalized.match(/(?:what is|calculate|solve)\s+([0-9+\-*/().\s]+)$/i)?.[1];
  if (!expr) return "";
  if (!/^[0-9+\-*/().\s]+$/.test(expr)) return "";

  try {
    const result = Function(`"use strict"; return (${expr});`)();
    if (Number.isFinite(result)) {
      return `The result is ${result}.`;
    }
  } catch {
    return "";
  }
  return "";
}

async function tryWebAnswer(message) {
  const query = String(message || "").trim();
  if (!query) return "";

  try {
    const capitalAnswer = await tryCountryCapitalAnswer(query);
    if (capitalAnswer) return capitalAnswer;

    const mathAnswer = tryMathAnswer(query);
    if (mathAnswer) return mathAnswer;
  } catch {
    return "";
  }

  return "";
}

function buildOfflineReply(message) {
  const text = String(message || "").trim();
  const lower = text.toLowerCase();

  if (!text) {
    return "Please type a question and I will help.";
  }

  if (lower.includes("jwt") || lower.includes("json web token")) {
    return "JWT (JSON Web Token) is a standard way to securely transmit information between parties as a JSON object. It is commonly used for authentication and authorization in modern web apps.";
  }

  if (lower.includes("mern")) {
    return "MERN is a popular full-stack JavaScript technology stack: MongoDB (Database), Express (Backend), React (Frontend), Node.js (Runtime).";
  }

  if (lower.includes("react")) {
    return "React is a JavaScript library for building fast and interactive user interfaces. It is maintained by Meta and is very popular for single-page applications.";
  }

  if (lower.includes("node") || lower.includes("nodejs")) {
    return "Node.js is a JavaScript runtime that allows developers to run JavaScript on the server side. It is fast, scalable, and widely used for backend development.";
  }

  if (lower.includes("mongodb")) {
    return "MongoDB is a NoSQL database that stores data in flexible, JSON-like documents. It is popular for its scalability and ease of use with JavaScript.";
  }

  if (lower.includes("express")) {
    return "Express.js is a fast, minimalist web framework for Node.js used to build robust APIs and web servers.";
  }

  if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey")) {
    return "Hello! How can I help you today?";
  }

  if (lower.includes("how are you")) {
    return "I'm doing great! Ready to answer your questions.";
  }

  return `I received: "${message}"\n\nTry asking clear questions like:\n• What is JWT?\n• What is MERN stack?\n• Capital of India?\n• What is React?`;
}

export async function generateAiReply({ history, message }) {
  const apiKey = getApiKey();

  // Try Real OpenAI API First
  if (apiKey) {
    const baseUrl = (process.env.AI_BASE_URL || "https://api.openai.com/v1").replace(/\/+$/, "");
    const model = process.env.AI_MODEL || "gpt-4o-mini";
    const url = `${baseUrl}/chat/completions`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages: buildMessages(history, message),
          temperature: 0.7
        })
      });

      if (response.ok) {
        const data = await response.json();
        const content = data?.choices?.[0]?.message?.content;
        if (content) return content;
      }
    } catch (err) {
      console.error("API Error:", err.message);
    }
  }

  // Smart Offline Fallback
  const webAnswer = await tryWebAnswer(message);
  if (webAnswer) return webAnswer;

  return buildOfflineReply(message);
}