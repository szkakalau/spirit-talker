/** 将磁力模长（µT 量级）映射到 PRD 要求的 0–1000 显示刻度（示意，非专业 EMF） */
export function mapMicroTeslaToDisplayMagnitude(uT: number): number {
  if (!Number.isFinite(uT) || uT < 0) return 0;
  const lo = 22;
  const hi = 70;
  const n = ((uT - lo) / (hi - lo)) * 1000;
  return Math.max(0, Math.min(1000, Math.round(n)));
}

export function spikeFromDelta(prev: number, next: number): number {
  const d = Math.abs(next - prev);
  return Math.min(1000, Math.round(next + d * 3));
}
