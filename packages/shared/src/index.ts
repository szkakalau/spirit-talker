export const PlanTier = {
  MONTHLY: 'MONTHLY',
  QUARTERLY: 'QUARTERLY',
  YEARLY: 'YEARLY',
} as const;
export type PlanTier = (typeof PlanTier)[keyof typeof PlanTier];

export const OrderStatus = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  CLOSED: 'CLOSED',
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

/** Stripe Checkout is the only payment channel in production */
export const PaymentChannel = {
  STRIPE: 'STRIPE',
} as const;
export type PaymentChannel = (typeof PaymentChannel)[keyof typeof PaymentChannel];

/** Amounts in USD cents for Stripe */
export const PLAN_PRICES_USD_CENTS: Record<PlanTier, number> = {
  [PlanTier.MONTHLY]: 499,
  [PlanTier.QUARTERLY]: 1299,
  [PlanTier.YEARLY]: 4499,
};

export const PLAN_DURATION_DAYS: Record<PlanTier, number> = {
  [PlanTier.MONTHLY]: 30,
  [PlanTier.QUARTERLY]: 90,
  [PlanTier.YEARLY]: 365,
};

/** Display helpers (USD) */
export function formatUsd(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}
