const STORAGE_KEY = 'st_analytics_consent';

export type AnalyticsConsent = 'granted' | 'denied';

export function getGaMeasurementId(): string {
  return (import.meta.env.VITE_GA_MEASUREMENT_ID ?? '').trim();
}

export function isGa4Configured(): boolean {
  return getGaMeasurementId().length > 0;
}

export function getStoredAnalyticsConsent(): AnalyticsConsent | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'granted' || v === 'denied') return v;
  } catch {
    /* private mode / blocked */
  }
  return null;
}

export function setStoredAnalyticsConsent(value: AnalyticsConsent): void {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    /* ignore */
  }
}
