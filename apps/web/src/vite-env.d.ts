/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  /** Canonical public origin (no trailing slash); used at build time for SEO meta in index.html */
  readonly VITE_SITE_ORIGIN?: string;
  /** Support inbox for billing / privacy requests (optional in dev) */
  readonly VITE_SUPPORT_EMAIL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
