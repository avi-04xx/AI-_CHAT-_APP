# AI Chat App (MERN)

Simple MERN chat app that calls an AI provider from the backend.

## Folder structure (Frontend + Backend)
- **Frontend (React)**: `client/`
  - Main UI: `client/src/App.jsx`
  - React entry: `client/src/main.jsx`
  - Styles: `client/src/styles.css`
  - Vite config: `client/vite.config.js`
- **Backend (Express)**: `server/`
  - Server entry: `server/src/index.js`
  - Auth routes: `server/src/routes/auth.js`
  - Chat routes: `server/src/routes/chat.js`
  - AI call logic: `server/src/ai.js`
  - MongoDB connect: `server/src/db.js`
  - JWT helpers: `server/src/auth.js`
  - Mongo models: `server/src/models/User.js`, `server/src/models/Message.js`

## Requirements
- Node.js 18+ (fetch built-in)
- MongoDB connection string (MongoDB Atlas is fine)

## Setup
Create `server/.env`:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/aichat
PORT=5000
JWT_SECRET=change_me
AI_PROVIDER=openai
AI_API_KEY=your_key_here
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4o-mini
```

Install deps:

```bash
npm install
```

Run both client and server:

```bash
npm run dev
```

Open the app at the URL printed by the client (usually `http://localhost:5173`).

## Notes
- The browser never sees your AI key; only the server uses it.
- **Login/Register**: frontend `client/src/App.jsx`, backend `server/src/routes/auth.js`.
- If `AI_API_KEY` is missing/invalid, the server returns a mock reply (so the UI still works).

