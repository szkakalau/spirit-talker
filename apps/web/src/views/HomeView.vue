<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import PayWall from '../components/PayWall.vue';
import { track } from '../lib/analytics';
import { useMembershipStore } from '../stores/membership';

const router = useRouter();
const route = useRoute();
const membership = useMembershipStore();

const showPay = computed(() => route.query.pay === '1');

onMounted(() => {
  void membership.refresh();
  void handleCheckoutReturn();
});

watch(
  () => route.query.checkout,
  () => {
    void handleCheckoutReturn();
  },
);

async function handleCheckoutReturn() {
  const checkout = route.query.checkout;
  const sessionId = typeof route.query.session_id === 'string' ? route.query.session_id : '';
  if (checkout === 'success' && sessionId) {
    await membership.confirmStripeSession(sessionId);
    await membership.refresh();
    track('EV009', { session_id: sessionId });
    router.replace({ path: '/', query: {} });
  } else if (checkout === 'cancel') {
    router.replace({ path: '/', query: {} });
  }
}

function go(path: string, feature: string) {
  track('EV002', { feature, page: 'home' });
  router.push(path);
}

function openPay() {
  track('EV008', { page: 'home' });
  router.push({ path: '/', query: { pay: '1' } });
}

function closePay() {
  router.replace({ path: '/', query: {} });
}
</script>

<template>
  <div class="mx-auto flex min-h-[100dvh] max-w-6xl flex-col px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-6 sm:pb-10 sm:pt-8">
    <PayWall v-if="showPay" @close="closePay" />

    <header class="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
      <div class="flex-1">
        <p class="text-sm text-violet-300/90">Spirit Talker · Web</p>
        <h1 class="mt-1 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Spirit Talker Pro</h1>
        <p class="mt-3 max-w-xl text-sm leading-relaxed text-zinc-400">
          Browser-based EMF-style meter, spirit word prompts, and EVP recording. Readings are mapped from device sensors for atmosphere only—not a calibrated
          instrument.
        </p>
        <div class="mt-4 flex flex-wrap items-center gap-2 text-xs">
          <span class="rounded-full border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-zinc-300">{{ membership.statusLabel }}</span>
          <button
            type="button"
            class="min-h-[44px] rounded-full border border-zinc-800 px-4 py-2 hover:border-zinc-600 active:bg-zinc-900"
            @click="membership.refresh()"
          >
            Refresh status
          </button>
          <span v-if="membership.lastError" class="text-amber-400/90">{{ membership.lastError }}</span>
        </div>
      </div>
      <button
        type="button"
        class="hidden min-h-[48px] shrink-0 rounded-xl bg-violet-600 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-violet-900/40 hover:bg-violet-500 active:scale-[0.99] sm:inline-flex sm:items-center sm:justify-center"
        @click="openPay"
      >
        Upgrade
      </button>
    </header>

    <main class="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <button
        type="button"
        class="group flex min-h-[128px] flex-col rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 text-left shadow-sm transition active:scale-[0.99] sm:min-h-[140px] sm:p-6 sm:hover:-translate-y-0.5 sm:hover:border-violet-500/50 sm:hover:shadow-xl sm:hover:shadow-violet-950/40"
        @click="go('/emf', 'emf')"
      >
        <span class="text-lg font-medium text-white group-hover:text-violet-200">EMF meter</span>
        <span class="mt-2 text-sm leading-relaxed text-zinc-400">Gauge + ~30s waveform, alerts over threshold</span>
      </button>
      <button
        type="button"
        class="group flex min-h-[128px] flex-col rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 text-left shadow-sm transition active:scale-[0.99] sm:min-h-[140px] sm:p-6 sm:hover:-translate-y-0.5 sm:hover:border-violet-500/50 sm:hover:shadow-xl sm:hover:shadow-violet-950/40"
        @click="go('/spirit', 'spirit')"
      >
        <span class="text-lg font-medium text-white group-hover:text-violet-200">Spirit words</span>
        <span class="mt-2 text-sm leading-relaxed text-zinc-400">Manual or EMF-triggered words with history</span>
      </button>
      <button
        type="button"
        class="group flex min-h-[128px] flex-col rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 text-left shadow-sm transition active:scale-[0.99] sm:col-span-2 sm:min-h-[140px] sm:p-6 xl:col-span-1 sm:hover:-translate-y-0.5 sm:hover:border-violet-500/50 sm:hover:shadow-xl sm:hover:shadow-violet-950/40"
        @click="go('/evp', 'evp')"
      >
        <span class="text-lg font-medium text-white group-hover:text-violet-200">EVP recorder</span>
        <span class="mt-2 text-sm leading-relaxed text-zinc-400">Long sessions, waveform, markers, download</span>
      </button>
    </main>

    <footer class="mt-auto pt-10 text-center text-xs leading-relaxed text-zinc-600 sm:mt-10">
      <span>Entertainment use · </span>
      <RouterLink to="/privacy" class="text-zinc-500 underline decoration-zinc-700 underline-offset-2 hover:text-violet-400">Privacy Policy</RouterLink>
      <span> · </span>
      <RouterLink to="/terms" class="text-zinc-500 underline decoration-zinc-700 underline-offset-2 hover:text-violet-400">Terms &amp; Disclaimer</RouterLink>
    </footer>

    <div
      class="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-800/80 bg-zinc-950/95 p-3 backdrop-blur-md sm:hidden"
      style="padding-bottom: max(0.75rem, env(safe-area-inset-bottom))"
    >
      <button
        type="button"
        class="flex min-h-[52px] w-full items-center justify-center rounded-xl bg-violet-600 text-base font-semibold text-white shadow-lg active:scale-[0.99]"
        @click="openPay"
      >
        Upgrade with Stripe
      </button>
    </div>
  </div>
</template>
