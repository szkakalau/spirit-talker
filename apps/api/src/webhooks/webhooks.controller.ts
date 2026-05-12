import { BadRequestException, Controller, Headers, Post, Req } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { OrdersService } from '../orders/orders.service';
import { StripeService } from '../stripe/stripe.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(
    private readonly orders: OrdersService,
    private readonly stripeService: StripeService,
  ) {}

  @Post('stripe')
  async handleStripe(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string | undefined,
  ) {
    if (!this.stripeService.isEnabled()) {
      throw new BadRequestException('Stripe not configured');
    }
    const raw = req.rawBody;
    if (!raw || !signature) {
      throw new BadRequestException('Missing raw body or stripe-signature');
    }
    let event: ReturnType<StripeService['constructEvent']>;
    try {
      event = this.stripeService.constructEvent(raw, signature);
    } catch {
      throw new BadRequestException('Invalid Stripe signature');
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as {
        id: string;
        metadata?: { orderId?: string };
        client_reference_id?: string | null;
        payment_status?: string | null;
      };
      const orderId = session.metadata?.orderId ?? session.client_reference_id ?? undefined;
      if (orderId && session.payment_status === 'paid') {
        await this.orders.markPaid(orderId, {
          stripeSessionId: session.id,
          paymentStatus: session.payment_status,
        });
      }
    }

    return { received: true };
  }
}
