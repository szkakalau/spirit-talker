const KEY = 'spirit-talker-device-id';

function randomId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID().replace(/-/g, '');
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 14)}`;
}

export function getOrCreateDeviceId(): string {
  try {
    const existing = localStorage.getItem(KEY);
    if (existing && existing.length >= 8) return existing;
    const id = randomId();
    localStorage.setItem(KEY, id);
    return id;
  } catch {
    return randomId();
  }
}
