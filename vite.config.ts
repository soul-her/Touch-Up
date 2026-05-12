import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  server: {
    // allow access via LAN & ngrok
    host: true,

    // ✅ ADD THIS
    allowedHosts: [
      "lore-radiometric-neglectingly.ngrok-free.dev",
    ],

    // OPTIONAL (fixes HMR issues on ngrok)
    hmr: {
      host: "lore-radiometric-neglectingly.ngrok-free.dev",
      protocol: "wss",
    },
  },
});
