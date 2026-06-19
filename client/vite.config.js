import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/AI-_CHAT-_APP/",     // ← This is very important
  server: {
    port: 5173,
    strictPort: true
  }
});