import type { Router } from 'vue-router';
import { subscribeAnalytics } from './analytics';
import { getGaMeasurementId, getStoredAnalyticsConsent, type AnalyticsConsent } from './analyticsConsent';

let unsubscribe: (() => void) | null = null;
let scriptLoaded = false;
let ga4Ready = false;

function gtag(...args: unknown[]): void {
  window.gtag?.(...args);
}

function flattenParams(payload?: Record<string, unknown>): Record<string, string | number | boolean> {
  if (!payload) return {};
  const out: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(payload)) {
    if (v === undefined || v === null) continue;
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
      out[k.slice(0, 40)] = v;
    } else {
      try {
        out[k.slice(0, 40)] = JSON.stringify(v);
      } catch {
        /* skip */
      }
    }
  }
  return out;
}

function loadGtagScript(measurementId: string): Promise<void> {
  if (scriptLoaded) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    s.onload = () => {
      scriptLoaded = true;
      resolve();
    };
    s.onerror = () => reject(new Error('gtag load failed'));
    document.head.appendChild(s);
  });
}

/**
 * Wire GA4 after explicit consent. Idempotent.
 */
export async function enableGa4AfterConsent(choice: AnalyticsConsent): Promise<void> {
  if (choice !== 'granted') return;
  const measurementId = getGaMeasurementId();
  if (!measurementId || unsubscribe) return;

  try {
    await loadGtagScript(measurementId);
  } catch {
    return;
  }

  gtag('js', new Date());
  gtag('consent', 'update', {
    analytics_storage: 'granted',
  });
  gtag('config', measurementId, {
    send_page_view: false,
    anonymize_ip: true,
  });

  unsubscribe = subscribeAnalytics((eventId, payload) => {
    gtag('event', eventId, flattenParams(payload));
  });

  ga4Ready = true;
}

function sendPageView(to: { fullPath: string; name?: string | symbol | null }) {
  gtag('event', 'page_view', {
    page_path: to.fullPath,
    page_title: typeof to.name === 'string' ? to.name : String(to.name ?? ''),
    page_location: typeof window !== 'undefined' ? `${window.location.origin}${to.fullPath}` : undefined,
  });
}

export function flushGa4PageViewForCurrentRoute(router: Router): void {
  if (getStoredAnalyticsConsent() !== 'granted' || !ga4Ready) return;
  sendPageView(router.currentRoute.value);
}

export function attachGa4SpaPageViews(router: Router): void {
  if (!getGaMeasurementId()) return;

  router.afterEach((to) => {
    if (getStoredAnalyticsConsent() !== 'granted' || !ga4Ready) return;
    sendPageView(to);
  });
}
