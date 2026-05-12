/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  /** Canonical public origin (no trailing slash); used at build time for SEO meta in index.html */
  readonly VITE_SITE_ORIGIN?: string;
  /** Support inbox for billing / privacy requests (optional in dev) */
  readonly VITE_SUPPORT_EMAIL?: string;
  /** Google Analytics 4 Measurement ID (G-XXXXXXXX). When set, production shows consent banner before loading gtag. */
  readonly VITE_GA_MEASUREMENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
