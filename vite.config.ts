/*
 * vite.config.ts
 * Vite build configuration for Petr-FE-Like.
 * Minimal setup: resolves src/ as root alias, outputs to dist/.
 * No extra plugins required — TypeScript is handled natively by Vite's esbuild transformer.
 */

import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
});
