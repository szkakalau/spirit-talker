<script setup lang="ts">
import { computed } from 'vue';
import LegalPageShell from '../components/LegalPageShell.vue';
import { getSupportEmail } from '../lib/siteContact';

const support = computed(() => getSupportEmail());
const effective = 'May 12, 2026';
</script>

<template>
  <LegalPageShell title="Privacy Policy">
    <p class="text-xs text-zinc-500">Effective date: {{ effective }}. Spirit Talker (“we”, “us”) operates the Spirit Talker web application.</p>

    <h2>Summary</h2>
    <p>
      This app is built for entertainment. We use a random device identifier stored in your browser to check Pro entitlements against our servers. EVP
      recordings stay on your device unless you export them yourself. Payments go through Stripe. Optional usage analytics (GA4 when configured) load only after
      cookie consent; otherwise events stay local to the browser except for development console logging.
    </p>

    <h2>Information we collect</h2>
    <ul>
      <li>
        <strong class="text-zinc-300">Device identifier (deviceId).</strong> A random ID is generated and kept in <code class="text-zinc-400">localStorage</code> so the
        app can call our API to read or update subscription state tied to that ID. The same value is sent when creating checkout sessions.
      </li>
      <li>
        <strong class="text-zinc-300">Server records for billing and access.</strong> Our backend may store: device row, orders (plan tier, amount, status),
        entitlement (plan tier and validity end), and payment audit rows derived from Stripe webhooks. We do not intentionally store full payment card numbers;
        Stripe handles card data.
      </li>
      <li>
        <strong class="text-zinc-300">Sensor and session data in the browser.</strong> EMF-style readings use device magnetometer APIs when you grant permission.
        Spirit word and meter state run locally. This data is not uploaded to our servers by default.
      </li>
      <li>
        <strong class="text-zinc-300">EVP audio.</strong> Recordings, waveforms, markers, and downloads are stored in your browser (IndexedDB). They are not uploaded
        to our servers as part of the MVP product flow.
      </li>
      <li>
        <strong class="text-zinc-300">Usage analytics.</strong> The client emits named events (for example screen actions and checkout outcomes). In development,
        events may appear in the browser console. In production, if you set <code class="text-zinc-400">VITE_GA_MEASUREMENT_ID</code>, we may load Google Analytics 4
        after you accept the in-app cookie banner; until then, Consent Mode keeps measurement storage denied and the GA script is not fetched. Other vendors (for example
        Mixpanel) can subscribe to the same <code class="text-zinc-400">track</code> hook in your fork. Third parties process data under their own policies.
      </li>
      <li>
        <strong class="text-zinc-300">Technical data.</strong> Like most hosted APIs, ours may receive IP addresses and standard HTTP logs at the infrastructure
        layer (for example your hosting provider’s access logs). Retention depends on your host’s settings.
      </li>
    </ul>

    <h2>What we do not aim to collect</h2>
    <ul>
      <li>We do not ask for a separate account password for Spirit Talker in the MVP web flow described in this repository.</li>
      <li>We do not request your contacts, photo library, or microphone except for EVP features you start explicitly in the app (microphone), and that audio stays local unless you export it.</li>
      <li>We do not sell personal information as a business model; if that ever changed, we would update this policy and, where required, obtain consent.</li>
    </ul>

    <h2>Third parties</h2>
    <ul>
      <li>
        <strong class="text-zinc-300">Stripe.</strong> Checkout, billing, receipts, and the
        <a href="https://stripe.com/privacy" rel="noopener noreferrer" target="_blank">Stripe Privacy Policy</a>
        apply to payment transactions and fraud signals Stripe collects.
      </li>
      <li>
        <strong class="text-zinc-300">Optional analytics (e.g. GA4).</strong> If you opt in via the cookie banner, the GA4 tag receives events mapped from our
        <code class="text-zinc-400">track</code> helper (including custom event names such as EV001–EV012) and standard page views on navigation. If you decline, those
        tags are not loaded for that browser. You can change your mind by clearing site data for this origin.
      </li>
    </ul>

    <h2>Retention</h2>
    <p>
      Browser-side deviceId and IndexedDB EVP data persist until you clear site data or uninstall the PWA. Server-side order and entitlement rows are kept for
      accounting, fraud prevention, and support until deleted according to your operational policy or on request where feasible. Webhook audit payloads may be
      retained for security and dispute handling; minimize sensitive fields in those logs in your deployment if possible.
    </p>

    <h2>Your choices and rights</h2>
    <ul>
      <li>Clearing site data removes the local deviceId (you may need to restore purchases or contact support to re-link a subscription) and resets the analytics consent choice so the cookie banner can appear again.</li>
      <li>Where applicable law grants access, correction, portability, or erasure, you may request help with server-side records associated with your deviceId.</li>
      <li>Stripe provides self-service invoices and payment history in its customer flows; cancellation and card updates are typically handled there.</li>
    </ul>

    <h2>Children</h2>
    <p>The service is not directed at children under 13, and we do not knowingly collect personal information from them.</p>

    <h2>International users</h2>
    <p>If you access the app from regions with data-protection laws (for example the EEA or UK), additional rights or obligations may apply; contact us and we will respond in line with applicable law.</p>

    <h2>Changes</h2>
    <p>We may update this policy when features or vendors change. The effective date at the top will be revised; material changes should be communicated in-product where practical.</p>

    <h2>Contact</h2>
    <p v-if="support">
      Privacy and data requests: <a :href="`mailto:${support}`">{{ support }}</a>
    </p>
    <p v-else>
      Privacy and data requests: use the support email published in your production deployment environment variable
      <code class="text-zinc-400">VITE_SUPPORT_EMAIL</code>, or the contact information on your app store listing or Stripe receipt.
    </p>
  </LegalPageShell>
</template>
