import { defineStore } from 'pinia';
import { ref } from 'vue';
import { mapMicroTeslaToDisplayMagnitude, spikeFromDelta } from '../lib/emfMapping';

type EmfSource = 'magnetometer' | 'simulated' | 'idle';

export const useEmfStore = defineStore('emf', () => {
  const running = ref(false);
  const source = ref<EmfSource>('idle');
  const display = ref(0);
  /** ~6 samples/sec × 30s */
  const history = ref<number[]>([]);
  const alert = ref(false);
  const lastRaw = ref(0);
  const error = ref<string | null>(null);

  let magnetometer: { stop: () => void } | null = null;
  let simTimer: ReturnType<typeof setInterval> | null = null;
  let lastDisplay = 0;

  function pushSample(displayVal: number) {
    lastDisplay = displayVal;
    display.value = displayVal;
    history.value = [...history.value.slice(-179), displayVal];
    alert.value = displayVal > 500;
  }

  function stop() {
    running.value = false;
    source.value = 'idle';
    error.value = null;
    if (simTimer) {
      clearInterval(simTimer);
      simTimer = null;
    }
    if (magnetometer) {
      try {
        magnetometer.stop();
      } catch {
        /* ignore */
      }
      magnetometer = null;
    }
  }

  function startSimulated() {
    stop();
    running.value = true;
    source.value = 'simulated';
    let t = 0;
    simTimer = setInterval(() => {
      t += 1;
      const base = 180 + Math.sin(t / 7) * 120;
      const noise = (Math.random() - 0.5) * 80;
      let v = Math.round(base + noise);
      if (Math.random() < 0.03) v = Math.min(1000, v + 350);
      pushSample(Math.max(0, Math.min(1000, v)));
    }, 170);
  }

  async function startMagnetometer() {
    stop();
    const MagnetometerCtor = (
      globalThis as unknown as {
        Magnetometer?: new (o?: { frequency?: number }) => EventTarget & {
          start: () => Promise<void>;
          stop: () => void;
          x: number;
          y: number;
          z: number;
        };
      }
    ).Magnetometer;
    if (!MagnetometerCtor) {
      error.value = 'Magnetometer not supported — using simulated readings.';
      startSimulated();
      return;
    }
    try {
      const mag = new MagnetometerCtor({ frequency: 10 });
      magnetometer = mag;
      mag.addEventListener('reading', () => {
        const x = mag.x;
        const y = mag.y;
        const z = mag.z;
        const uT = Math.sqrt(x * x + y * y + z * z);
        lastRaw.value = uT;
        let mapped = mapMicroTeslaToDisplayMagnitude(uT);
        mapped = spikeFromDelta(lastDisplay, mapped);
        pushSample(mapped);
      });
      await mag.start();
      running.value = true;
      source.value = 'magnetometer';
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Magnetometer failed — using simulated readings.';
      startSimulated();
    }
  }

  async function start() {
    await startMagnetometer();
  }

  return {
    running,
    source,
    display,
    history,
    alert,
    lastRaw,
    error,
    start,
    startSimulated,
    stop,
    pushSample,
  };
});
