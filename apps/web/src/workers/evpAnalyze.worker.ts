/** 离线分析：基于窗口 RMS 的启发式，标记相对微弱或突发片段（非实验室 EVP） */

type AnalyzeInput = {
  samples: Float32Array;
  sampleRate: number;
  windowMs: number;
};

type AnalyzeOutput = {
  markers: { startSec: number; endSec: number }[];
};

export {};

function median(arr: number[]): number {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
}

self.onmessage = (ev: MessageEvent<AnalyzeInput>) => {
  const { samples, sampleRate, windowMs } = ev.data;
  const win = Math.max(256, Math.floor((sampleRate * windowMs) / 1000));
  const hop = Math.floor(win / 2);
  const rmsList: number[] = [];
  const times: number[] = [];
  for (let i = 0; i + win < samples.length; i += hop) {
    let sum = 0;
    for (let j = 0; j < win; j++) {
      const v = samples[i + j] ?? 0;
      sum += v * v;
    }
    const rms = Math.sqrt(sum / win);
    rmsList.push(rms);
    times.push(i / sampleRate);
  }
  const med = median(rmsList);
  const floor = Math.max(1e-6, med * 0.08);
  const faintHi = Math.max(floor * 3, med * 0.35);
  const burstLo = med * 2.2;

  const flags: boolean[] = rmsList.map((r) => (r > floor && r < faintHi) || r > burstLo);

  const markers: { startSec: number; endSec: number }[] = [];
  let i = 0;
  while (i < flags.length) {
    if (!flags[i]) {
      i += 1;
      continue;
    }
    const startIdx = i;
    while (i < flags.length && flags[i]) i += 1;
    const endIdx = i - 1;
    const startSec = times[startIdx] ?? 0;
    const endSec = (times[endIdx] ?? startSec) + windowMs / 1000;
    if (endSec - startSec >= 0.12) {
      markers.push({ startSec, endSec: Math.min(endSec, samples.length / sampleRate) });
    }
  }

  const merged: { startSec: number; endSec: number }[] = [];
  const gap = 0.45;
  for (const m of markers) {
    const last = merged[merged.length - 1];
    if (last && m.startSec - last.endSec <= gap) {
      last.endSec = Math.max(last.endSec, m.endSec);
    } else {
      merged.push({ ...m });
    }
  }

  const out: AnalyzeOutput = { markers: merged.slice(0, 32) };
  postMessage(out);
};
