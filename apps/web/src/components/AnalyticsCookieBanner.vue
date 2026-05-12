<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { getStoredAnalyticsConsent, isGa4Configured, setStoredAnalyticsConsent } from '../lib/analyticsConsent';
import { enableGa4AfterConsent, flushGa4PageViewForCurrentRoute } from '../lib/ga4';
import { router } from '../router';

const visible = ref(false);
const busy = ref(false);

onMounted(() => {
  if (isGa4Configured() && getStoredAnalyticsConsent() === null) {
    visible.value = true;
  }
});

async function accept() {
  busy.value = true;
  setStoredAnalyticsConsent('granted');
  visible.value = false;
  await enableGa4AfterConsent('granted');
  flushGa4PageViewForCurrentRoute(router);
  busy.value = false;
}

function decline() {
  setStoredAnalyticsConsent('denied');
  visible.value = false;
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
      role="dialog"
      aria-labelledby="st-cookie-title"
      aria-describedby="st-cookie-desc"
    >
      <div
        class="pointer-events-auto max-w-lg rounded-xl border border-zinc-800/90 bg-zinc-950/95 p-4 shadow-2xl shadow-black/50 backdrop-blur-md sm:p-5"
      >
        <p id="st-cookie-title" class="text-sm font-medium text-zinc-100">Analytics and cookies</p>
        <p id="st-cookie-desc" class="mt-2 text-xs leading-relaxed text-zinc-400">
          We use optional measurement (for example Google Analytics 4) to understand traffic and product usage. No marketing tags load unless you accept. See our
          <RouterLink to="/privacy" class="text-violet-400 underline decoration-violet-600/40 underline-offset-2 hover:text-violet-300">Privacy Policy</RouterLink>
          for details.
        </p>
        <div class="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            class="rounded-lg bg-violet-600 px-3 py-2 text-xs font-medium text-white hover:bg-violet-500 disabled:opacity-50"
            :disabled="busy"
            @click="accept"
          >
            Accept
          </button>
          <button
            type="button"
            class="rounded-lg border border-zinc-700 bg-zinc-900/80 px-3 py-2 text-xs font-medium text-zinc-200 hover:border-zinc-600 hover:bg-zinc-800"
            :disabled="busy"
            @click="decline"
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
