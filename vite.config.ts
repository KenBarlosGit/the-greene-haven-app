import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Deployed to https://kenbarlosgit.github.io/the-greene-haven-app/
// so the build needs assets prefixed with that subpath. Dev still uses `/`.
export default defineConfig(({ command }) => ({
  plugins: [react(), tailwindcss()],
  base: command === 'build' ? '/the-greene-haven-app/' : '/',
}));
