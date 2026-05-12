export type EvpAnalyzeOutput = {
  markers: { startSec: number; endSec: number }[];
};

type AnalyzeInput = {
  samples: Float32Array;
  sampleRate: number;
  windowMs: number;
};

export function analyzeSamplesInWorker(samples: Float32Array, sampleRate: number, windowMs = 80): Promise<EvpAnalyzeOutput> {
  const copy = new Float32Array(samples.length);
  copy.set(samples);
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('../workers/evpAnalyze.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (ev: MessageEvent<EvpAnalyzeOutput>) => {
      worker.terminate();
      resolve(ev.data);
    };
    worker.onerror = (e) => {
      worker.terminate();
      reject(e);
    };
    const payload: AnalyzeInput = { samples: copy, sampleRate, windowMs };
    worker.postMessage(payload, [copy.buffer]);
  });
}
