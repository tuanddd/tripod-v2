import path from "node:path";
import { defineConfig } from "vite";

// GitHub Pages project site: https://tuanddd.github.io/tripod-v2/
// Override with VITE_BASE=/ for local absolute paths if needed.
const base = process.env.VITE_BASE ?? "/tripod-v2/";

export default defineConfig({
  base,
  server: { port: 5173 },
  resolve: {
    alias: {
      // Self-contained engine source (vendored for GH Pages)
      "triple-pod-game-engine": path.resolve(
        __dirname,
        "vendor/triple-pod/index.ts"
      ),
      "game-interface": path.resolve(__dirname, "vendor/game-interface"),
    },
  },
  optimizeDeps: {
    include: ["prando", "deepmerge", "lodash.uniqby", "human-id"],
  },
  build: {
    chunkSizeWarningLimit: 2000,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
});
