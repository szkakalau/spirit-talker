<script setup lang="ts">
import * as echarts from 'echarts';
import { storeToRefs } from 'pinia';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useEmfStore } from '../stores/emf';
import { track } from '../lib/analytics';

const router = useRouter();
const emf = useEmfStore();
const { display, history, alert, running, source, error } = storeToRefs(emf);

const gaugeEl = ref<HTMLDivElement | null>(null);
const lineEl = ref<HTMLDivElement | null>(null);
let gaugeChart: echarts.ECharts | null = null;
let lineChart: echarts.ECharts | null = null;
let resizeObserver: ResizeObserver | null = null;
let lastAlert = false;
const startedAt = ref(0);
const maxSeen = ref(0);

const sourceLabel = computed(() => {
  if (source.value === 'magnetometer') return 'Magnetometer';
  if (source.value === 'simulated') return 'Simulated';
  return 'Idle';
});

function playBeep() {
  try {
    const ctx = new AudioContext();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'square';
    o.frequency.value = 880;
    o.connect(g);
    g.connect(ctx.destination);
    g.gain.value = 0.08;
    o.start();
    setTimeout(() => {
      o.stop();
      void ctx.close();
    }, 160);
  } catch {
    /* ignore */
  }
}

function haptic() {
  try {
    void navigator.vibrate?.(120);
  } catch {
    /* ignore */
  }
}

watch(alert, (v) => {
  if (v && !lastAlert) {
    playBeep();
    haptic();
  }
  lastAlert = v;
});

watch(display, (v) => {
  maxSeen.value = Math.max(maxSeen.value, v);
  gaugeChart?.setOption({
    series: [{ data: [{ value: v }] }],
  });
});

watch(
  history,
  (arr) => {
    lineChart?.setOption({
      xAxis: { type: 'category', data: arr.map((_, i) => String(i)) },
      series: [{ data: arr }],
    });
  },
  { deep: true },
);

function resizeCharts() {
  gaugeChart?.resize();
  lineChart?.resize();
}

onMounted(async () => {
  startedAt.value = Date.now();
  maxSeen.value = 0;
  track('EV003', { path: '/emf' });
  if (gaugeEl.value) {
    gaugeChart = echarts.init(gaugeEl.value);
    gaugeChart.setOption({
      backgroundColor: 'transparent',
      series: [
        {
          type: 'gauge',
          min: 0,
          max: 1000,
          splitNumber: 10,
          radius: '92%',
          axisLine: {
            lineStyle: {
              width: 14,
              color: [
                [0.5, '#4ade80'],
                [1, '#f87171'],
              ],
            },
          },
          pointer: { length: '70%', width: 5 },
          detail: { valueAnimation: true, formatter: '{value} (scale)', color: '#e4e4e7', fontSize: 16 },
          data: [{ value: 0 }],
        },
      ],
    });
  }
  if (lineEl.value) {
    lineChart = echarts.init(lineEl.value);
    lineChart.setOption({
      backgroundColor: 'transparent',
      grid: { left: 36, right: 12, top: 16, bottom: 24 },
      xAxis: { type: 'category', data: [] },
      yAxis: { type: 'value', min: 0, max: 1000, splitLine: { lineStyle: { color: '#27272a' } } },
      series: [
        {
          type: 'line',
          smooth: true,
          showSymbol: false,
          lineStyle: { width: 2, color: '#a78bfa' },
          areaStyle: { color: 'rgba(167,139,250,0.12)' },
          data: [],
        },
      ],
    });
  }

  const wrap = gaugeEl.value?.parentElement;
  if (wrap) {
    resizeObserver = new ResizeObserver(() => resizeCharts());
    resizeObserver.observe(wrap);
  }
  window.addEventListener('resize', resizeCharts);
  await emf.start();
});

onUnmounted(() => {
  track('EV004', { maxEmf: maxSeen.value, durationMs: Date.now() - startedAt.value });
  emf.stop();
  resizeObserver?.disconnect();
  resizeObserver = null;
  window.removeEventListener('resize', resizeCharts);
  gaugeChart?.dispose();
  lineChart?.dispose();
  gaugeChart = null;
  lineChart = null;
});

function togglePause() {
  if (running.value) {
    emf.stop();
    track('EV004', { action: 'pause', maxEmf: maxSeen.value });
  } else {
    void emf.start();
    track('EV003', { action: 'resume' });
  }
}

function forceSim() {
  emf.startSimulated();
}
</script>

<template>
  <div class="mx-auto flex min-h-[100dvh] max-w-5xl flex-col gap-4 px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-4">
    <header class="flex items-center gap-3">
      <button
        type="button"
        class="min-h-[48px] min-w-[48px] rounded-xl border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-200 hover:border-zinc-600 active:bg-zinc-800"
        @click="router.back()"
      >
        Back
      </button>
      <div class="min-w-0 flex-1">
        <h1 class="text-xl font-semibold text-white">EMF meter</h1>
        <p class="text-xs text-zinc-500">0–1000 display scale · ≥5 Hz · Source: {{ sourceLabel }}</p>
      </div>
    </header>

    <p v-if="error" class="rounded-xl border border-amber-900/60 bg-amber-950/40 px-4 py-3 text-sm text-amber-100">
      {{ error }}
    </p>

    <div
      class="rounded-2xl border p-3 transition-colors sm:p-4"
      :class="alert ? 'border-red-500/70 bg-red-950/30 shadow-[0_0_40px_rgba(239,68,68,0.25)]' : 'border-zinc-800 bg-zinc-900/50'"
    >
      <div class="flex flex-col items-stretch gap-2 lg:flex-row lg:items-center">
        <div ref="gaugeEl" class="h-[min(56vw,280px)] w-full min-h-[200px] lg:h-64 lg:flex-1 lg:max-w-md" />
        <div class="flex w-full flex-col justify-center gap-2 lg:w-40 xl:w-44">
          <div class="text-center text-4xl font-semibold tabular-nums text-white">{{ display }}</div>
          <div class="text-center text-xs uppercase tracking-wide text-zinc-500">relative units</div>
          <div v-if="alert" class="text-center text-sm font-medium text-red-300">Alert: over 500</div>
        </div>
      </div>
    </div>

    <div class="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-3">
      <p class="mb-2 px-1 text-xs text-zinc-500">Last ~30 seconds (~6 samples/sec)</p>
      <div ref="lineEl" class="h-40 w-full min-h-[160px] sm:h-48" />
    </div>

    <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
      <button
        type="button"
        class="min-h-[52px] flex-1 rounded-xl bg-zinc-800 px-4 text-base font-medium text-white hover:bg-zinc-700 active:scale-[0.99] sm:flex-none"
        @click="togglePause"
      >
        {{ running ? 'Pause' : 'Resume' }}
      </button>
      <button
        type="button"
        class="min-h-[52px] flex-1 rounded-xl border border-zinc-700 px-4 text-base text-zinc-200 hover:border-zinc-500 active:scale-[0.99] sm:flex-none"
        @click="forceSim"
      >
        Use simulated data
      </button>
    </div>
  </div>
</template>
