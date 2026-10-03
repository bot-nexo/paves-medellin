import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    target: "es2015", // Ayuda a la compatibilidad con navegadores in-app antiguos (WhatsApp, IG)
  },
});