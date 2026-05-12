import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import type { Plugin } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';

const webRoot = path.dirname(fileURLToPath(import.meta.url));

/** Injects absolute Open Graph / canonical tags when VITE_SITE_ORIGIN is set at build or dev. */
function seoOriginPlugin(origin: string): Plugin {
  return {
    name: 'spirit-talker-seo-origin',
    transformIndexHtml(html) {
      const o = origin.replace(/\/+$/, '');
      const ogImage = o ? `${o}/og.png` : '/og.png';
      const ogUrlMeta = o ? `<meta property="og:url" content="${o}/" />` : '';
      const canonicalLink = o ? `<link rel="canonical" href="${o}/" />` : '';
      return html
        .replace('__SEO_OG_URL_META__', ogUrlMeta)
        .replace('__SEO_CANONICAL_LINK__', canonicalLink)
        .replaceAll('%SEO_OG_IMAGE%', ogImage);
    },
  };
}

// Resolve shared package to TS sources so Vite dev/prod never relies on CJS interop from dist/
const sharedSrc = path.resolve(webRoot, '../../packages/shared/src/index.ts');

const apiProxy = {
  '/api': {
    target: 'http://localhost:3000',
    changeOrigin: true,
    rewrite: (p: string) => p.replace(/^\/api/, ''),
  },
} as const;

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, webRoot, '');
  const siteOrigin = (env.VITE_SITE_ORIGIN ?? '').trim();

  return {
    plugins: [vue(), tailwindcss(), seoOriginPlugin(siteOrigin)],
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
  };
});
