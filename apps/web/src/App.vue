<script setup lang="ts">
import { onMounted } from 'vue';
import { RouterView } from 'vue-router';
import AnalyticsCookieBanner from './components/AnalyticsCookieBanner.vue';
import { track } from './lib/analytics';
import { getStoredAnalyticsConsent } from './lib/analyticsConsent';
import { enableGa4AfterConsent, flushGa4PageViewForCurrentRoute } from './lib/ga4';
import { router } from './router';

onMounted(async () => {
  if (getStoredAnalyticsConsent() === 'granted') {
    await enableGa4AfterConsent('granted');
    flushGa4PageViewForCurrentRoute(router);
  }
  if (!sessionStorage.getItem('st_ev001')) {
    sessionStorage.setItem('st_ev001', '1');
    track('EV001', { path: location.pathname, ref: document.referrer || undefined });
  }
  window.addEventListener('beforeinstallprompt', () => {
    track('EV011', { event: 'beforeinstallprompt' });
  });
});
</script>

<template>
  <div class="min-h-screen min-h-[100dvh] bg-zinc-950 text-zinc-100">
    <RouterView />
    <AnalyticsCookieBanner />
  </div>
</template>
