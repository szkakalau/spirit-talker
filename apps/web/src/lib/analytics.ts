type Payload = Record<string, unknown>;

const listeners: Array<(id: string, payload?: Payload) => void> = [];

/**
 * PRD 埋点 EV001–EV012：开发环境打 console；生产可通过 subscribe 接 GA4 / Mixpanel。
 * GA4：设置 VITE_GA_MEASUREMENT_ID 并在用户接受 Cookie 横幅后加载 gtag（见 ga4.ts）。
 */
export function track(id: string, payload?: Payload) {
  if (import.meta.env.DEV) {
    console.info(`[analytics] ${id}`, payload ?? {});
  }
  for (const fn of listeners) {
    try {
      fn(id, payload);
    } catch {
      /* ignore */
    }
  }
}

export function subscribeAnalytics(fn: (id: string, payload?: Payload) => void) {
  listeners.push(fn);
  return () => {
    const i = listeners.indexOf(fn);
    if (i >= 0) listeners.splice(i, 1);
  };
}
