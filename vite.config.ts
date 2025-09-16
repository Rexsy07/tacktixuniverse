import { defineConfig } from "vite"
import react from "@vitejs/plugin-react-swc"
import path from "path"

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: "/tacktixuniverse/", // ✅ repo name for GitHub Pages
  server: {
    host: mode === "production" ? "localhost" : "::",
    port: 8080,
    strictPort: true,
    https: mode === "production",
  },
  plugins: [
    react(),
    // example: add conditional plugin if you’re using it
    // mode === "development" && componentTagger()
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}))
