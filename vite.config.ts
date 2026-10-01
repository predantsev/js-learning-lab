import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// The platform UI. Built once and served by the local Node server (server/app.mjs).
export default defineConfig({
  root: path.resolve(import.meta.dirname, 'app'),
  base: '/',
  plugins: [react()],
  resolve: { alias: { '@shared': path.resolve(import.meta.dirname, 'shared') } },
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist/app'),
    emptyOutDir: true,
    sourcemap: true,
    chunkSizeWarningLimit: 4000,
    rollupOptions: {
      input: {
        index: path.resolve(import.meta.dirname, 'app/index.html'),
        harness: path.resolve(import.meta.dirname, 'app/harness.html'),
      },
    },
  },
});
