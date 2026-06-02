import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Deployed to Vercel at root. Base is always `/`.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/',
});
