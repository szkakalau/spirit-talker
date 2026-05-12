<script setup lang="ts">
import { PlanTier, PLAN_PRICES_USD_CENTS, formatUsd } from '@spirit-talker/shared';
import { computed, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { useMembershipStore } from '../stores/membership';
import { track } from '../lib/analytics';
import { getSupportEmail, supportMailto } from '../lib/siteContact';

const emit = defineEmits<{ close: [] }>();

const membership = useMembershipStore();
const tier = ref<PlanTier>(PlanTier.MONTHLY);
const busy = ref(false);
const hint = ref<string | null>(null);
const lastOrderId = ref<string | null>(null);

const tiers: { id: PlanTier; label: string }[] = [
  { id: PlanTier.MONTHLY, label: 'Monthly' },
  { id: PlanTier.QUARTERLY, label: 'Quarterly' },
  { id: PlanTier.YEARLY, label: 'Yearly' },
];

const webAppUrl = typeof window !== 'undefined' ? window.location.origin : '';

const supportEmail = computed(() => getSupportEmail());
const supportMailHref = computed(() => supportMailto());

async function pay() {
  busy.value = true;
  hint.value = null;
  track('EV008', { tier: tier.value, channel: 'stripe' });
  try {
    const created = await membership.createCheckoutSession(tier.value, webAppUrl);
    lastOrderId.value = created.orderId;
    if (created.mode === 'stripe' && created.checkoutUrl) {
      window.location.href = created.checkoutUrl;
      return;
    }
    hint.value =
      'Stripe is not configured on the server. Use “Complete mock payment” for local testing (no STRIPE_SECRET_KEY).';
  } catch (e) {
    track('EV010', { reason: e instanceof Error ? e.message : 'unknown' });
    hint.value = e instanceof Error ? e.message : 'Could not start checkout';
  } finally {
    busy.value = false;
  }
}

async function mockPay() {
  if (!lastOrderId.value) return;
  busy.value = true;
  try {
    const r = await membership.mockComplete(lastOrderId.value);
    if (!r.ok) {
      hint.value = r.error ?? 'Mock payment unavailable';
      track('EV010', { reason: 'mock_disabled' });
      return;
    }
    const ok = await membership.pollUntilPaid(lastOrderId.value, 8, 1500);
    if (ok) {
      track('EV009', { orderId: lastOrderId.value, tier: tier.value });
      await membership.refresh();
      emit('close');
    } else {
      hint.value = 'Timed out confirming payment. Tap “Refresh status” on the home screen.';
      track('EV010', { reason: 'poll_timeout' });
    }
  } catch (e) {
    track('EV010', { reason: e instanceof Error ? e.message : 'unknown' });
    hint.value = e instanceof Error ? e.message : 'Payment failed';
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-8 sm:items-center sm:p-4"
  >
    <div
      class="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl shadow-violet-950/40 sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      <div class="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 class="text-lg font-semibold leading-snug text-white">Upgrade to Pro</h2>
          <p class="mt-1 text-xs leading-relaxed text-zinc-500">
            Secure checkout powered by Stripe (cards, Apple Pay / Google Pay where available).
          </p>
        </div>
        <button
          type="button"
          class="min-h-[44px] min-w-[44px] shrink-0 rounded-xl px-3 text-sm text-zinc-400 hover:bg-zinc-900 hover:text-white"
          @click="emit('close')"
        >
          Close
        </button>
      </div>

      <div class="mb-4 grid grid-cols-3 gap-2">
        <button
          v-for="t in tiers"
          :key="t.id"
          type="button"
          class="flex min-h-[52px] flex-col items-center justify-center rounded-xl border px-2 py-2 text-center text-sm transition active:scale-[0.98]"
          :class="
            tier === t.id ? 'border-violet-500 bg-violet-950/50 text-violet-100' : 'border-zinc-800 bg-zinc-900 text-zinc-300'
          "
          @click="tier = t.id"
        >
          <span class="font-medium">{{ t.label }}</span>
          <span class="mt-0.5 text-xs tabular-nums text-zinc-500">{{ formatUsd(PLAN_PRICES_USD_CENTS[t.id]) }}</span>
        </button>
      </div>

      <p v-if="hint" class="mb-3 rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2.5 text-xs leading-relaxed text-zinc-300">
        {{ hint }}
      </p>

      <div class="flex flex-col gap-2">
        <button
          type="button"
          class="min-h-[52px] rounded-xl bg-violet-600 text-base font-semibold text-white shadow-lg shadow-violet-900/30 hover:bg-violet-500 disabled:opacity-50 active:scale-[0.99]"
          :disabled="busy"
          @click="pay"
        >
          Pay with Stripe
        </button>
        <button
          type="button"
          class="min-h-[48px] rounded-xl border border-zinc-700 text-sm text-zinc-200 hover:border-zinc-500 disabled:opacity-50"
          :disabled="busy || !lastOrderId"
          @click="mockPay"
        >
          Complete mock payment (local dev only)
        </button>
      </div>

      <p class="mt-5 text-center text-[11px] leading-relaxed text-zinc-500">
        By continuing you agree to the
        <RouterLink to="/terms" class="text-violet-400/90 underline decoration-violet-600/40 underline-offset-2 hover:text-violet-300">Terms &amp; Disclaimer</RouterLink>
        and
        <RouterLink to="/privacy" class="text-violet-400/90 underline decoration-violet-600/40 underline-offset-2 hover:text-violet-300">Privacy Policy</RouterLink>.
      </p>
      <p v-if="supportEmail && supportMailHref" class="mt-2 text-center text-[11px] text-zinc-500">
        <a :href="supportMailHref" class="text-violet-400/90 underline decoration-violet-600/40 underline-offset-2 hover:text-violet-300">Contact support</a>
        <span class="text-zinc-600"> · {{ supportEmail }}</span>
      </p>
      <p v-else class="mt-2 text-center text-[11px] text-zinc-600">
        Receipts and subscription management: use links from Stripe after payment. Set <span class="font-mono text-zinc-500">VITE_SUPPORT_EMAIL</span> to show a support address here.
      </p>
    </div>
  </div>
</template>
