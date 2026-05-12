import { PlanTier } from '@spirit-talker/shared';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { apiGet, apiPost } from '../lib/api';
import { getOrCreateDeviceId } from '../lib/deviceId';

type EntitlementRes =
  | { active: true; planTier: string; validUntil: string }
  | { active: false; reason?: string; validUntil?: string };

type OrderRes = {
  id: string;
  status: string;
  tier: string;
  channel: string;
  amountCents: number;
};

export const useMembershipStore = defineStore('membership', () => {
  const deviceId = ref(getOrCreateDeviceId());
  const active = ref(false);
  const validUntil = ref<Date | null>(null);
  const planTier = ref<string | null>(null);
  const loading = ref(false);
  const lastError = ref<string | null>(null);

  const statusLabel = computed(() => {
    if (loading.value) return 'Checking…';
    if (active.value) {
      const d = validUntil.value;
      return d ? `Pro until ${d.toLocaleString('en-US')}` : 'Pro active';
    }
    return 'Free';
  });

  async function refresh() {
    loading.value = true;
    lastError.value = null;
    try {
      const q = encodeURIComponent(deviceId.value);
      const res = await apiGet<EntitlementRes>(`/entitlements/me?deviceId=${q}`);
      active.value = !!res.active;
      planTier.value = res.active ? res.planTier : null;
      validUntil.value = res.active ? new Date(res.validUntil) : res.validUntil ? new Date(res.validUntil) : null;
    } catch (e) {
      lastError.value = e instanceof Error ? e.message : 'Could not load membership';
      active.value = false;
    } finally {
      loading.value = false;
    }
  }

  async function createCheckoutSession(tier: PlanTier, webAppUrl: string) {
    return apiPost<{
      orderId: string;
      mode: string;
      checkoutUrl?: string;
      prepay?: { mode: string; sdkParams?: Record<string, unknown> };
    }>('/orders', { deviceId: deviceId.value, tier, webAppUrl });
  }

  async function confirmStripeSession(sessionId: string) {
    return apiGet<{ ok: boolean; error?: string }>(`/orders/checkout/confirm?session_id=${encodeURIComponent(sessionId)}`);
  }

  async function mockComplete(orderId: string) {
    return apiPost<{ ok: boolean; error?: string }>(`/orders/${orderId}/mock-complete`, {});
  }

  async function fetchOrder(orderId: string) {
    return apiGet<OrderRes>(`/orders/${orderId}`);
  }

  async function pollUntilPaid(orderId: string, attempts = 24, intervalMs = 2000) {
    for (let i = 0; i < attempts; i += 1) {
      const o = await fetchOrder(orderId);
      if (o.status === 'PAID') return true;
      await new Promise((r) => setTimeout(r, intervalMs));
    }
    return false;
  }

  return {
    deviceId,
    active,
    validUntil,
    planTier,
    loading,
    lastError,
    statusLabel,
    refresh,
    createCheckoutSession,
    confirmStripeSession,
    mockComplete,
    pollUntilPaid,
  };
});
