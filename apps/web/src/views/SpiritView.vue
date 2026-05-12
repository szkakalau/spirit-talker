<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useEmfStore } from '../stores/emf';
import { useSpiritStore } from '../stores/spirit';
import { track } from '../lib/analytics';

const router = useRouter();
const emf = useEmfStore();
const spirit = useSpiritStore();
const { display, running } = storeToRefs(emf);
const { currentWord, wordVisible, autoMode, history } = storeToRefs(spirit);

const prevEmf = ref(0);

watch(display, (v) => {
  spirit.tryAutoFromEmf(v, prevEmf.value);
  prevEmf.value = v;
});

function manual() {
  track('EV005', { mode: 'manual' });
  spirit.manualCommunicate();
}

onMounted(async () => {
  track('EV005', { mode: 'page_open' });
  prevEmf.value = display.value;
  if (!running.value) await emf.start();
});

onUnmounted(() => {
  emf.stop();
});
</script>

<template>
  <div class="mx-auto flex min-h-[100dvh] max-w-3xl flex-col gap-5 px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-4">
    <header class="flex items-center gap-3">
      <button
        type="button"
        class="min-h-[48px] min-w-[48px] rounded-xl border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-200 hover:border-zinc-600 active:bg-zinc-800"
        @click="router.back()"
      >
        Back
      </button>
      <div class="min-w-0 flex-1">
        <h1 class="text-xl font-semibold text-white">Spirit words</h1>
        <p class="text-xs text-zinc-500">Auto mode reacts to EMF swings; tap Communicate for a manual pull</p>
      </div>
    </header>

    <div class="flex flex-wrap items-center gap-3">
      <label class="flex min-h-[44px] cursor-pointer items-center gap-2 text-sm text-zinc-300">
        <input v-model="autoMode" type="checkbox" class="h-5 w-5 rounded border-zinc-600 bg-zinc-900" />
        Auto (EMF spikes)
      </label>
      <span class="text-xs text-zinc-600">EMF: {{ display }}</span>
    </div>

    <section
      class="relative flex min-h-[min(42vh,280px)] items-center justify-center overflow-hidden rounded-2xl border border-violet-900/40 bg-gradient-to-b from-zinc-900 to-black p-6 shadow-inner shadow-black/60 sm:min-h-[240px] sm:p-8"
    >
      <p
        class="select-none px-2 text-center text-[clamp(1.75rem,6vw,3rem)] font-medium leading-tight tracking-wide text-violet-100"
        :class="wordVisible ? 'opacity-100 blur-0' : 'opacity-0 blur-sm'"
        style="transition: opacity 1.8s ease, filter 1.8s ease"
      >
        {{ currentWord || '…' }}
      </p>
    </section>

    <button
      type="button"
      class="min-h-[52px] rounded-2xl bg-violet-600 py-3 text-base font-semibold text-white shadow-lg shadow-violet-900/40 hover:bg-violet-500 active:scale-[0.99]"
      @click="manual"
    >
      Communicate (manual)
    </button>

    <div>
      <h2 class="mb-2 text-sm font-medium text-zinc-400">Last 20</h2>
      <ul class="space-y-2">
        <li
          v-for="(item, idx) in history"
          :key="idx"
          class="flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-sm"
        >
          <span class="min-w-0 flex-1 text-zinc-100">{{ item.text }}</span>
          <span class="shrink-0 text-xs text-zinc-500">{{ item.trigger === 'auto' ? 'Auto' : 'Manual' }}</span>
        </li>
        <li
          v-if="history.length === 0"
          class="rounded-xl border border-dashed border-zinc-800 px-4 py-6 text-center text-sm text-zinc-500"
        >
          No words yet
        </li>
      </ul>
    </div>
  </div>
</template>
