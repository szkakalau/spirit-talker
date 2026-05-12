/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  /** Canonical public origin (no trailing slash); used at build time for SEO meta in index.html */
  readonly VITE_SITE_ORIGIN?: string;
  /** Support inbox for billing / privacy requests (optional in dev) */
  readonly VITE_SUPPORT_EMAIL?: string;
  /** Google Analytics 4 Measurement ID (G-XXXXXXXX). When set, production shows consent banner before loading gtag. */
  readonly VITE_GA_MEASUREMENT_ID?: string;
  /** When `true`, production build shows mock checkout (for staging). Dev server always allows mock. */
  readonly VITE_ENABLE_MOCK_CHECKOUT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
