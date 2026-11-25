// Builds the yravglive page (app/src) into ../dist, which is committed so a repo needs only Node to run the page.
// cd app && npm install && npm run build
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  root: fileURLToPath(new URL('./src', import.meta.url)),
  base: '/',
  plugins: [react()],
  build: { outDir: fileURLToPath(new URL('../dist', import.meta.url)), emptyOutDir: true },
});
