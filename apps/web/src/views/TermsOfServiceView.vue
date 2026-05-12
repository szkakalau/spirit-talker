<script setup lang="ts">
import { computed } from 'vue';
import LegalPageShell from '../components/LegalPageShell.vue';
import { getSupportEmail, supportMailto } from '../lib/siteContact';
import { PLAN_DURATION_DAYS, PlanTier, formatUsd, PLAN_PRICES_USD_CENTS } from '@spirit-talker/shared';

const support = computed(() => getSupportEmail());
const mailto = computed(() => supportMailto());
const effective = 'May 12, 2026';

const plans = [
  { tier: PlanTier.MONTHLY, label: 'Monthly', price: formatUsd(PLAN_PRICES_USD_CENTS[PlanTier.MONTHLY]), days: PLAN_DURATION_DAYS[PlanTier.MONTHLY] },
  { tier: PlanTier.QUARTERLY, label: 'Quarterly', price: formatUsd(PLAN_PRICES_USD_CENTS[PlanTier.QUARTERLY]), days: PLAN_DURATION_DAYS[PlanTier.QUARTERLY] },
  { tier: PlanTier.YEARLY, label: 'Yearly', price: formatUsd(PLAN_PRICES_USD_CENTS[PlanTier.YEARLY]), days: PLAN_DURATION_DAYS[PlanTier.YEARLY] },
];
</script>

<template>
  <LegalPageShell title="Terms of Service & Disclaimer">
    <p class="text-xs text-zinc-500">Effective date: {{ effective }}.</p>

    <h2>Agreement</h2>
    <p>
      By using Spirit Talker or purchasing a subscription, you agree to these terms and our
      <router-link to="/privacy">Privacy Policy</router-link>. If you do not agree, do not use the service.
    </p>

    <h2>Nature of the service (important)</h2>
    <p>
      Spirit Talker is <strong class="text-zinc-300">entertainment and novelty software</strong>. EMF-style displays, spirit word prompts, and EVP tools are
      provided for atmosphere and creative use. The app is <strong class="text-zinc-300">not a scientific instrument</strong>, is not calibrated for safety or
      environmental hazard detection, and <strong class="text-zinc-300">does not verify paranormal phenomena</strong>.
    </p>
    <p>
      Any readings, words, or interpretations are generated or mapped from sensors and algorithms for fun. <strong class="text-zinc-300">We make no promises</strong>
      about ghosts, spirits, or the accuracy of any “paranormal” conclusion. You are responsible for how you use the app, including compliance with local laws,
      private property rules, and respect for others.
    </p>

    <h2>Subscriptions and billing</h2>
    <p>Pro access is sold as a prepaid subscription processed by Stripe. Advertised tiers (USD, subject to tax where applicable):</p>
    <ul>
      <li v-for="p in plans" :key="p.tier">{{ p.label }}: {{ p.price }} per term, Pro access for {{ p.days }} days from successful payment (see in-app checkout for current pricing).</li>
    </ul>
    <p>
      <strong class="text-zinc-300">Renewal.</strong> Unless you cancel before the end of the paid term, Stripe may charge the next period according to the plan
      you selected and Stripe’s settings for that Checkout session. Exact renewal behavior is shown at checkout and in Stripe’s emails and customer portal when
      you enable those features.
    </p>
    <p>
      <strong class="text-zinc-300">Cancellation.</strong> Cancel through the Stripe customer portal or payment-method management links provided by Stripe (often
      included on receipts). If you do not see a link, contact support with the email below.
    </p>
    <p>
      <strong class="text-zinc-300">Refunds.</strong> Refund eligibility depends on applicable law and the refund policy you publish as the merchant of record.
      Stripe processes refunds when issued; we do not guarantee refunds for change of mind unless your published policy says otherwise.
    </p>

    <h2>Acceptable use</h2>
    <p>You will not misuse the API, attempt to circumvent access controls, harass others, or use the product in a way that violates law or third-party rights.</p>

    <h2>Disclaimers</h2>
    <p>
      THE SERVICE IS PROVIDED “AS IS” AND “AS AVAILABLE.” TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE DISCLAIM IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR
      A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE ARE NOT LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR LOSS OF
      PROFITS OR DATA, ARISING FROM YOUR USE OF THE APP.
    </p>

    <h2>Changes</h2>
    <p>We may modify features or these terms. Continued use after changes constitutes acceptance of the updated terms where allowed by law.</p>

    <h2>Contact</h2>
    <p v-if="support && mailto">
      Questions about these terms or billing: <a :href="mailto">{{ support }}</a>
    </p>
    <p v-else>
      Set <code class="text-zinc-400">VITE_SUPPORT_EMAIL</code> in production for a visible support address, or refer users to the contact on Stripe receipts
      and your store listing.
    </p>
  </LegalPageShell>
</template>
