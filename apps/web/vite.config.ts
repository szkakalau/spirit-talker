import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';

const webRoot = path.dirname(fileURLToPath(import.meta.url));

// Resolve shared package to TS sources so Vite dev/prod never relies on CJS interop from dist/
const sharedSrc = path.resolve(webRoot, '../../packages/shared/src/index.ts');

const apiProxy = {
  '/api': {
    target: 'http://localhost:3000',
    changeOrigin: true,
    rewrite: (p: string) => p.replace(/^\/api/, ''),
  },
} as const;

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@spirit-talker/shared': sharedSrc,
    },
  },
  server: {
    port: 5173,
    strictPort: false,
    proxy: { ...apiProxy },
  },
  // Same as dev: without this, `vite preview` serves index.html for /api/* and JSON.parse fails.
  preview: {
    proxy: { ...apiProxy },
  },
});
