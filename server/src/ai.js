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
    // Safe because only digits/operators are allowed by regex above.
    const result = Function(`"use strict"; return (${expr});`)();
    if (Number.isFinite(result)) {
      return `The result is ${result}.`;
    }
  } catch {
    return "";
  }

  return "";
}

async function tryDuckDuckGoAnswer(query) {
  const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&no_redirect=1`;
  const res = await fetch(url);
  if (!res.ok) return "";
  const data = await res.json();

  const abstract = cleanText(data?.AbstractText);
  if (abstract) return abstract;

  const firstTopic = data?.RelatedTopics?.find((item) => cleanText(item?.Text));
  const topicText = cleanText(firstTopic?.Text);
  if (topicText) return topicText;

  return "";
}

async function tryWikipediaAnswer(query) {
  const searchUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=1&namespace=0&format=json`;
  const searchRes = await fetch(searchUrl);
  if (!searchRes.ok) return "";

  const searchData = await searchRes.json();
  const title = cleanText(searchData?.[1]?.[0]);
  if (!title) return "";

  const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  const summaryRes = await fetch(summaryUrl);
  if (!summaryRes.ok) return "";

  const summaryData = await summaryRes.json();
  const extract = cleanText(summaryData?.extract);
  if (!extract) return "";

  return extract;
}

async function tryDictionaryAnswer(query) {
  const lower = query.toLowerCase();
  const defineMatch = lower.match(/^(define|meaning of)\s+(.+)$/);
  if (!defineMatch) return "";

  const word = cleanText(defineMatch[2]);
  if (!word) return "";

  const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`;
  const res = await fetch(url);
  if (!res.ok) return "";

  const data = await res.json();
  const firstMeaning = data?.[0]?.meanings?.[0];
  const firstDefinition = firstMeaning?.definitions?.[0]?.definition;
  const partOfSpeech = cleanText(firstMeaning?.partOfSpeech);
  const definition = cleanText(firstDefinition);
  if (!definition) return "";

  if (partOfSpeech) {
    return `${word} (${partOfSpeech}): ${definition}`;
  }
  return `${word}: ${definition}`;
}

async function tryWebAnswer(message) {
  const query = String(message || "").trim();
  if (!query) return "";

  try {
    const capitalAnswer = await tryCountryCapitalAnswer(query);
    if (capitalAnswer) return capitalAnswer;

    const mathAnswer = tryMathAnswer(query);
    if (mathAnswer) return mathAnswer;

    const dictionaryAnswer = await tryDictionaryAnswer(query);
    if (dictionaryAnswer) return dictionaryAnswer;

    const wikipediaAnswer = await tryWikipediaAnswer(normalizeQuestionText(query));
    if (wikipediaAnswer) return wikipediaAnswer;

    const duckAnswer = await tryDuckDuckGoAnswer(normalizeQuestionText(query));
    if (duckAnswer) return duckAnswer;
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

  if (lower.includes("what is ai") || lower.includes("define ai")) {
    return "AI (Artificial Intelligence) is technology that helps computers understand patterns and perform tasks like answering questions, writing text, and making predictions.";
  }

  if (lower.includes("jwt")) {
    return "JWT (JSON Web Token) is a compact token format used for authentication and authorization. After login, the server signs a token with user data, and later verifies it to trust the user request.";
  }

  if (lower.includes("ipl") && lower.includes("team")) {
    return "IPL teams include: Chennai Super Kings, Mumbai Indians, Royal Challengers Bengaluru, Kolkata Knight Riders, Rajasthan Royals, Sunrisers Hyderabad, Delhi Capitals, Punjab Kings, Gujarat Titans, and Lucknow Super Giants.";
  }

  if (lower.includes("mern")) {
    return "MERN is a JavaScript full-stack: MongoDB (database), Express (backend API), React (frontend UI), and Node.js (runtime).";
  }

  if (lower.includes("javascript")) {
    return "JavaScript is a programming language used for web apps. In MERN, JavaScript runs in the browser (React) and on the server (Node.js).";
  }

  if (lower.includes("mongodb")) {
    return "MongoDB is a NoSQL database that stores data in JSON-like documents. It is flexible, fast for app development, and commonly used with Node.js.";
  }

  if (lower.includes("react")) {
    return "React is a frontend library for building UI components. It updates the screen efficiently when app state changes.";
  }

  if (lower.includes("node")) {
    return "Node.js lets you run JavaScript on the server. It is good for APIs, real-time apps, and full-stack JavaScript projects.";
  }

  if (lower.includes("express")) {
    return "Express is a lightweight Node.js framework used to build APIs and backend routes quickly.";
  }

  if (lower.includes("hello") || lower.includes("hi")) {
    return "Hello! Ask me any topic, and I will give you a clear short answer in this chat.";
  }

  return `I could not fetch a reliable live answer right now. Please rephrase your question clearly, for example: "What is the capital of India?" or "Define JWT".`;
}

export async function generateAiReply({ history, message }) {
  const apiKey = getApiKey();
  if (!apiKey) {
    const webAnswer = await tryWebAnswer(message);
    if (webAnswer) return webAnswer;
    return buildOfflineReply(message);
  }
  const baseUrl = (process.env.AI_BASE_URL || "https://api.openai.com/v1").replace(/\/+$/, "");
  const model = process.env.AI_MODEL || "gpt-4o-mini";
  const url = `${baseUrl}/chat/completions`;

  const body = {
    model,
    messages: buildMessages(history, message),
    temperature: 0.7
  };

  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    });
  } catch {
    const webAnswer = await tryWebAnswer(message);
    if (webAnswer) return webAnswer;
    return buildOfflineReply(message);
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    if (response.status === 401 || /invalid_api_key/i.test(errorText)) {
      const webAnswer = await tryWebAnswer(message);
      if (webAnswer) return webAnswer;
      return buildOfflineReply(message);
    }
    const webAnswer = await tryWebAnswer(message);
    if (webAnswer) return webAnswer;
    return buildOfflineReply(message);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    const webAnswer = await tryWebAnswer(message);
    if (webAnswer) return webAnswer;
    return buildOfflineReply(message);
  }
  return content;
}

