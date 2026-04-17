import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // We call the API directly from the browser (see VITE_API_URL).
    // This avoids proxy issues if the server auto-switches ports.
    port: 5173,
    strictPort: true
  }
});

