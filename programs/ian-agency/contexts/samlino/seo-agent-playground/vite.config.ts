import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    proxy: {
      // Backend API (schema generator + SEO auditor)
      "/api": {
        target: "http://localhost:8001",
        changeOrigin: true,
        proxyTimeout: 120_000,   // 2 min — large CSV uploads (150k rows) can take time
        timeout: 120_000,
      },
      // SEO auditor D3 tools (served as standalone HTML from Python)
      "/comparaja": {
        target: "http://localhost:8001",
        changeOrigin: true,
      },
      "/samlino": {
        target: "http://localhost:8001",
        changeOrigin: true,
      },
      // Local website copies
      "/www.samlino.dk": {
        target: "http://localhost:8001",
        changeOrigin: true,
      },
      "/www.comparaja.pt": {
        target: "http://localhost:8001",
        changeOrigin: true,
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
