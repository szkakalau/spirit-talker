import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';

const webRoot = path.dirname(fileURLToPath(import.meta.url));

// Resolve shared package to TS sources so Vite dev/prod never relies on CJS interop from dist/
const sharedSrc = path.resolve(webRoot, '../../packages/shared/src/index.ts');

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
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, ''),
      },
    },
  },
});
