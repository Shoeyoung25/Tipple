import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Dev: Vite serves the React app on :5173 and proxies API + uploads to the
// Express backend on :3001. In production the Express server serves the built
// assets directly, so this proxy is dev-only.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      "/api": "http://localhost:3001",
      "/uploads": "http://localhost:3001",
    },
  },
  build: {
    outDir: "dist",
  },
});
