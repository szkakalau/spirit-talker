<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue';
import { useRouter } from 'vue-router';
import { analyzeSamplesInWorker } from '../lib/evpAnalyzeClient';
import { evpDb, type EvpMarker } from '../lib/evpDb';
import { track } from '../lib/analytics';

const router = useRouter();

const MAX_MS = 30 * 60 * 1000;

const phase = ref<'idle' | 'recording' | 'analyzing' | 'done'>('idle');
const errorMsg = ref('');
const elapsedSec = ref(0);
const mimeUsed = ref('audio/webm');
const durationSec = ref(0);
const markers = shallowRef<EvpMarker[]>([]);
const lastBlob = shallowRef<Blob | null>(null);
const canvasLive = ref<HTMLCanvasElement | null>(null);
const canvasTimeline = ref<HTMLCanvasElement | null>(null);
const liveWrap = ref<HTMLDivElement | null>(null);
const timelineWrap = ref<HTMLDivElement | null>(null);

let mediaRecorder: MediaRecorder | null = null;
const chunks: Blob[] = [];
let inputStream: MediaStream | null = null;
let audioCtx: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let rafId = 0;
let tickId = 0;
let recordStarted = 0;
const elapsedLabel = computed(() => {
  const s = Math.floor(elapsedSec.value);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
});

function pickMime(): string {
  const c = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
  for (const t of c) {
    if (MediaRecorder.isTypeSupported(t)) return t;
  }
  return '';
}

function sizeCanvasToWrapper(canvas: HTMLCanvasElement, wrapper: HTMLElement | null) {
  if (!wrapper) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.max(1, Math.floor(wrapper.clientWidth * dpr));
  const h = Math.max(1, Math.floor(wrapper.clientHeight * dpr));
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
}

function drawLiveWave() {
  const canvas = canvasLive.value;
  const node = analyser;
  const wrap = liveWrap.value;
  if (!canvas || !node || !wrap) return;
  sizeCanvasToWrapper(canvas, wrap);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const buf = new Uint8Array(node.fftSize);
  node.getByteTimeDomainData(buf);
  ctx.fillStyle = '#09090b';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#a78bfa';
  ctx.lineWidth = Math.max(1, dprLine());
  ctx.beginPath();
  const step = Math.max(1, Math.floor(buf.length / w));
  for (let x = 0; x < w; x++) {
    const v = buf[x * step] ?? 128;
    const y = (v / 128) * h * 0.45 + h * 0.25;
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

function dprLine(): number {
  return Math.min(window.devicePixelRatio || 1, 2);
}

function loopDraw() {
  drawLiveWave();
  rafId = requestAnimationFrame(loopDraw);
}

function drawTimeline() {
  const canvas = canvasTimeline.value;
  const blob = lastBlob.value;
  const wrap = timelineWrap.value;
  if (!canvas || !blob || !wrap) return;
  sizeCanvasToWrapper(canvas, wrap);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#18181b';
  ctx.fillRect(0, 0, w, h);
  const d = Math.max(durationSec.value, 0.001);
  ctx.fillStyle = '#27272a';
  ctx.fillRect(8 * dprLine(), h / 2 - 3 * dprLine(), w - 16 * dprLine(), 6 * dprLine());
  ctx.fillStyle = 'rgba(248,113,113,0.85)';
  for (const m of markers.value) {
    const x1 = 8 * dprLine() + (m.startSec / d) * (w - 16 * dprLine());
    const x2 = 8 * dprLine() + (m.endSec / d) * (w - 16 * dprLine());
    ctx.fillRect(x1, h / 2 - 10 * dprLine(), Math.max(2 * dprLine(), x2 - x1), 20 * dprLine());
  }
}

async function startRecord() {
  errorMsg.value = '';
  chunks.length = 0;
  markers.value = [];
  lastBlob.value = null;
  durationSec.value = 0;
  const mime = pickMime();
  if (!mime) {
    errorMsg.value = 'This browser does not support a recordable audio MIME type.';
    return;
  }
  mimeUsed.value = mime;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        sampleRate: 44100,
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
      video: false,
    });
    inputStream = stream;
    audioCtx = new AudioContext({ sampleRate: 44100 });
    const src = audioCtx.createMediaStreamSource(stream);
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    src.connect(analyser);
    mediaRecorder = new MediaRecorder(stream, { mimeType: mime });
    mediaRecorder.addEventListener('dataavailable', (ev) => {
      if (ev.data.size > 0) chunks.push(ev.data);
    });
    mediaRecorder.start(750);
    phase.value = 'recording';
    recordStarted = performance.now();
    elapsedSec.value = 0;
    tickId = window.setInterval(() => {
      elapsedSec.value = (performance.now() - recordStarted) / 1000;
      if (performance.now() - recordStarted >= MAX_MS) void stopRecord();
    }, 250);
    loopDraw();
    track('EV006', { mime, sampleRate: audioCtx.sampleRate });
  } catch (e) {
    errorMsg.value = e instanceof Error ? e.message : 'Microphone permission denied';
  }
}

async function stopRecord() {
  if (phase.value !== 'recording') return;
  window.clearInterval(tickId);
  cancelAnimationFrame(rafId);
  track('EV007', { durationSec: elapsedSec.value, mime: mimeUsed.value });
  phase.value = 'analyzing';
  try {
    await new Promise<void>((resolve, reject) => {
      if (!mediaRecorder) return resolve();
      mediaRecorder.addEventListener('error', () => reject(new Error('MediaRecorder error')));
      mediaRecorder.addEventListener('stop', () => resolve(), { once: true });
      try {
        mediaRecorder.stop();
      } catch {
        resolve();
      }
    });
    inputStream?.getTracks().forEach((t) => t.stop());
    inputStream = null;
    await audioCtx?.close();
    audioCtx = null;
    analyser = null;

    const blob = new Blob(chunks, { type: mimeUsed.value });
    lastBlob.value = blob;
    const ab = await blob.arrayBuffer();
    const decodeCtx = new AudioContext();
    const audioBuf = await decodeCtx.decodeAudioData(ab);
    await decodeCtx.close();
    const ch0 = audioBuf.getChannelData(0);
    const copy = new Float32Array(ch0.length);
    copy.set(ch0);
    durationSec.value = audioBuf.duration;
    const { markers: mk } = await analyzeSamplesInWorker(copy, audioBuf.sampleRate, 90);
    markers.value = mk;
    await evpDb.recordings.add({
      createdAt: Date.now(),
      mime: mimeUsed.value,
      durationSec: audioBuf.duration,
      blob,
      markers: mk,
    });
    phase.value = 'done';
    await nextTick();
    drawTimeline();
  } catch (e) {
    errorMsg.value = e instanceof Error ? e.message : 'Analysis failed';
    phase.value = 'idle';
  } finally {
    mediaRecorder = null;
  }
}

function playSegment(m: EvpMarker) {
  const blob = lastBlob.value;
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const a = new Audio(url);
  a.currentTime = m.startSec;
  a.play().catch(() => {});
  const stopAt = (m.endSec - m.startSec) * 1000 + 80;
  window.setTimeout(() => {
    a.pause();
    URL.revokeObjectURL(url);
  }, stopAt);
}

function downloadFull() {
  const blob = lastBlob.value;
  if (!blob) return;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `evp-${Date.now()}.${mimeUsed.value.includes('webm') ? 'webm' : 'audio'}`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function scheduleCanvasRedraw() {
  if (phase.value === 'recording') drawLiveWave();
  if (phase.value === 'done') drawTimeline();
}

onMounted(() => {
  window.addEventListener('resize', scheduleCanvasRedraw);
});

watch(phase, () => void nextTick(scheduleCanvasRedraw));

onUnmounted(() => {
  window.clearInterval(tickId);
  cancelAnimationFrame(rafId);
  window.removeEventListener('resize', scheduleCanvasRedraw);
  inputStream?.getTracks().forEach((t) => t.stop());
  void audioCtx?.close();
});
</script>

<template>
  <div class="mx-auto flex min-h-[100dvh] max-w-3xl flex-col gap-4 px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-4">
    <header class="flex items-center gap-3">
      <button
        type="button"
        class="min-h-[48px] min-w-[48px] rounded-xl border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-200 hover:border-zinc-600 active:bg-zinc-800"
        @click="router.back()"
      >
        Back
      </button>
      <div class="min-w-0 flex-1">
        <h1 class="text-xl font-semibold text-white">EVP recorder</h1>
        <p class="text-xs leading-relaxed text-zinc-500">
          Up to 30 minutes · analyze on stop · markers saved locally (IndexedDB)
        </p>
      </div>
    </header>

    <p v-if="errorMsg" class="rounded-xl border border-red-900/50 bg-red-950/40 px-4 py-3 text-sm text-red-100">
      {{ errorMsg }}
    </p>

    <section class="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-3 sm:p-4">
      <div class="mb-2 flex items-center justify-between text-sm text-zinc-400">
        <span>Live waveform</span>
        <span v-if="phase === 'recording'" class="tabular-nums text-violet-200">{{ elapsedLabel }}</span>
      </div>
      <div ref="liveWrap" class="h-44 w-full sm:h-52">
        <canvas ref="canvasLive" class="h-full w-full rounded-lg bg-black"></canvas>
      </div>
    </section>

    <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
      <button
        v-if="phase === 'idle' || phase === 'done'"
        type="button"
        class="min-h-[52px] flex-1 rounded-2xl bg-violet-600 px-4 text-base font-semibold text-white hover:bg-violet-500 active:scale-[0.99] sm:flex-none"
        @click="startRecord"
      >
        Start recording
      </button>
      <button
        v-if="phase === 'recording'"
        type="button"
        class="min-h-[52px] flex-1 rounded-2xl bg-red-600 px-4 text-base font-semibold text-white hover:bg-red-500 active:scale-[0.99] sm:flex-none"
        @click="stopRecord"
      >
        Stop & analyze
      </button>
      <span v-if="phase === 'analyzing'" class="flex min-h-[52px] items-center text-sm text-zinc-400">Analyzing…</span>
    </div>

    <section v-if="phase === 'done' && lastBlob" class="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-3 sm:p-4">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h2 class="text-sm font-medium text-zinc-300">Results</h2>
        <button
          type="button"
          class="min-h-[44px] rounded-lg border border-zinc-700 px-4 py-2 text-xs text-zinc-200 hover:border-zinc-500"
          @click="downloadFull"
        >
          Download full take
        </button>
      </div>
      <p class="text-xs text-zinc-500">
        Duration {{ durationSec.toFixed(1) }}s · {{ mimeUsed }} · flagged segments (red)
      </p>
      <div ref="timelineWrap" class="h-24 w-full sm:h-28">
        <canvas ref="canvasTimeline" class="h-full w-full rounded-lg bg-black"></canvas>
      </div>
      <ul class="space-y-2">
        <li
          v-for="(m, idx) in markers"
          :key="idx"
          class="flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-3 text-sm"
        >
          <span class="tabular-nums text-zinc-200">{{ m.startSec.toFixed(2) }}s – {{ m.endSec.toFixed(2) }}s</span>
          <button type="button" class="min-h-[44px] text-violet-300 hover:text-violet-200" @click="playSegment(m)">
            Play clip
          </button>
        </li>
        <li v-if="markers.length === 0" class="text-center text-sm text-zinc-500">
          No strong anomalies detected — try a quieter room.
        </li>
      </ul>
    </section>
  </div>
</template>
