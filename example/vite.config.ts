import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "phoenix-presence-react": path.resolve(__dirname, "../src/index.ts"),
      phoenix: path.resolve(__dirname, "node_modules/phoenix"),
    },
  },
});
