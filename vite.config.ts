/*
 * vite.config.ts
 * Vite build configuration for Petr-FE-Like.
 * Minimal setup: resolves src/ as root alias, outputs to dist/.
 * base must match the GitHub Pages subdirectory (/Petr-FE-Like/) for absolute asset
 * resolution to work correctly when served from GitHub Pages.
 * No extra plugins required — TypeScript is handled natively by Vite's esbuild transformer.
 */

import { defineConfig } from 'vite';

export default defineConfig({
  base: '/Petr-FE-Like/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
});
