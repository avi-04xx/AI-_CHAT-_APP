import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/AI-_CHAT-_APP/",   // ← Important for GitHub Pages
});