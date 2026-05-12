/** Operator support inbox (billing, deletion requests). Set at build/deploy time. */
export function getSupportEmail(): string | undefined {
  const v = import.meta.env.VITE_SUPPORT_EMAIL;
  return typeof v === 'string' && v.includes('@') ? v.trim() : undefined;
}

export function supportMailto(): string | undefined {
  const e = getSupportEmail();
  return e ? `mailto:${e}` : undefined;
}
