type Payload = Record<string, unknown>;

const listeners: Array<(id: string, payload?: Payload) => void> = [];

/** PRD 埋点 EV001–EV012：MVP 默认 console，可挂载 GA4 / Mixpanel */
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
