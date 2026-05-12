<script setup lang="ts">
import { RouterLink, useRouter } from 'vue-router';

defineProps<{ title: string }>();

const router = useRouter();
</script>

<template>
  <div class="mx-auto min-h-[100dvh] max-w-3xl px-4 pb-12 pt-6 sm:pt-10">
    <div class="mb-8 flex flex-wrap items-center gap-3 text-sm">
      <button
        type="button"
        class="min-h-[44px] rounded-xl border border-zinc-800 px-4 text-zinc-300 hover:border-zinc-600 hover:text-white"
        @click="router.push('/')"
      >
        ← Home
      </button>
      <RouterLink to="/privacy" class="text-zinc-500 hover:text-violet-300">Privacy</RouterLink>
      <span class="text-zinc-700">·</span>
      <RouterLink to="/terms" class="text-zinc-500 hover:text-violet-300">Terms</RouterLink>
    </div>
    <article class="legal-doc text-sm leading-relaxed text-zinc-300">
      <h1 class="mb-6 text-2xl font-semibold tracking-tight text-white">{{ title }}</h1>
      <slot />
    </article>
  </div>
</template>

<style scoped>
.legal-doc :deep(h2) {
  margin-bottom: 0.75rem;
  margin-top: 2rem;
  font-size: 1rem;
  line-height: 1.5rem;
  font-weight: 600;
  color: #fafafa;
}
.legal-doc :deep(p) {
  margin-bottom: 0.75rem;
  color: #a1a1aa;
}
.legal-doc :deep(ul) {
  margin-bottom: 0.75rem;
  padding-left: 1.25rem;
  list-style-type: disc;
  color: #a1a1aa;
}
.legal-doc :deep(li + li) {
  margin-top: 0.375rem;
}
.legal-doc :deep(a) {
  color: #a78bfa;
  text-decoration: underline;
  text-decoration-color: rgba(139, 92, 246, 0.45);
  text-underline-offset: 2px;
}
.legal-doc :deep(a:hover) {
  color: #c4b5fd;
}
</style>
