import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/main.tsx"),
      name: "WeLinkInviteUI",
      formats: ["iife"],
      fileName: () => "welink-invite.js",
      cssFileName: "welink-invite-guest"
    },
    outDir: path.resolve(__dirname, "../../assets/welink-invite"),
    emptyOutDir: true,
    cssCodeSplit: false
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify("production")
  }
});
