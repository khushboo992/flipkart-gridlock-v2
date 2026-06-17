import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/flipkart-gridlock-v2/", // Yeh line bohot zaroorat hai!
});
