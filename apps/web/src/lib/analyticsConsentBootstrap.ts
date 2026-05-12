/**
 * Runs before GA script: Consent Mode defaults (denied) so no storage hits until the user opts in.
 * Only active when VITE_GA_MEASUREMENT_ID is set at build time.
 */
import { getGaMeasurementId } from './analyticsConsent';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const id = getGaMeasurementId();
if (typeof window !== 'undefined' && id) {
  window.dataLayer = window.dataLayer ?? [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer!.push(args);
  };
  window.gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    wait_for_update: 500,
  });
}
