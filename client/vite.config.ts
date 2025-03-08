import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path, { dirname } from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// This will handle development proxying to our FastAPI backend
const backendUrl = process.env.VITE_BACKEND_URL || 'http://prop-pulse-backend:8000';
if (!backendUrl) {
  console.error("Error: BACKEND_URL environment variable is not set");
} else {
  console.log(`Backend URL configured as: ${backendUrl}`);
}

export default defineConfig({
  plugins: [
    react(),
    // runtimeErrorOverlay(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
  // Configuring the dev server to proxy API requests to FastAPI
  server: {
    host: true,
    proxy: {
      '/api': {
        target: backendUrl,
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path, // Don't modify the path
        followRedirects: true,
      }
    }
  },
  build: {
    outDir: path.resolve(__dirname, "dist"),
    emptyOutDir: true,
  }
});