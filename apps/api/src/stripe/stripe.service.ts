import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PlanTier } from '@spirit-talker/shared';

type StripeClient = InstanceType<typeof Stripe>;

@Injectable()
export class StripeService {
  private readonly client: StripeClient | null;

  constructor(private readonly config: ConfigService) {
    const key = config.get<string>('STRIPE_SECRET_KEY');
    this.client = key ? new Stripe(key, { typescript: true }) : null;
  }

  isEnabled(): boolean {
    return this.client !== null;
  }

  async createCheckoutSession(params: {
    orderId: string;
    deviceId: string;
    tier: PlanTier;
    amountCents: number;
    webAppUrl: string;
  }): Promise<{ url: string; sessionId: string }> {
    if (!this.client) throw new Error('Stripe is not configured (set STRIPE_SECRET_KEY)');
    const base = params.webAppUrl.replace(/\/$/, '');
    const session = await this.client.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: params.amountCents,
            product_data: {
              name: `Spirit Talker Pro — ${params.tier}`,
              description: 'Unlock premium EVP & saved sessions',
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${base}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/?checkout=cancel`,
      metadata: {
        orderId: params.orderId,
        deviceId: params.deviceId,
        tier: params.tier,
      },
      client_reference_id: params.orderId,
    });
    if (!session.url) throw new Error('Stripe Checkout returned no redirect URL');
    return { url: session.url, sessionId: session.id };
  }

  constructEvent(payload: Buffer, signature: string) {
    if (!this.client) throw new Error('Stripe is not configured');
    const secret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!secret) throw new Error('STRIPE_WEBHOOK_SECRET is not set');
    return this.client.webhooks.constructEvent(payload, signature, secret);
  }

  async retrieveCheckoutSession(sessionId: string) {
    if (!this.client) throw new Error('Stripe is not configured');
    return this.client.checkout.sessions.retrieve(sessionId);
  }
}
