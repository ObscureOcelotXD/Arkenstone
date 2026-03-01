import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      // Proxy subgraph to avoid CORS when Graph Node runs on 8000
      "/subgraphs": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
});
