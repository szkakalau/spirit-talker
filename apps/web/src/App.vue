<script setup lang="ts">
import { onMounted } from 'vue';
import { RouterView } from 'vue-router';
import { track } from './lib/analytics';

onMounted(() => {
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
  </div>
</template>
