import { BadRequestException, Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersService } from './orders.service';
import { PaymentsService } from '../payments/payments.service';
import { StripeService } from '../stripe/stripe.service';

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly orders: OrdersService,
    private readonly payments: PaymentsService,
    private readonly stripe: StripeService,
    private readonly config: ConfigService,
  ) {}

  @Post()
  async create(@Body() dto: CreateOrderDto) {
    const { order, amountCents } = await this.orders.create(dto.deviceId, dto.tier);
    /** Prefer server WEB_APP_URL on Render so redirects cannot be spoofed */
    const webAppUrl =
      this.config.get<string>('WEB_APP_URL')?.trim() ||
      dto.webAppUrl?.trim() ||
      'http://localhost:5173';

    if (this.stripe.isEnabled()) {
      const { url, sessionId } = await this.stripe.createCheckoutSession({
        orderId: order.id,
        deviceId: dto.deviceId,
        tier: dto.tier,
        amountCents,
        webAppUrl,
      });
      await this.orders.attachStripeSession(order.id, sessionId);
      return {
        orderId: order.id,
        status: order.status,
        amountCents,
        currency: 'usd',
        mode: 'stripe',
        checkoutUrl: url,
      };
    }

    const prepay = this.payments.buildMockPrepay(order.id, amountCents, dto.deviceId);
    return {
      orderId: order.id,
      status: order.status,
      amountCents,
      currency: 'usd',
      mode: 'mock',
      prepay,
    };
  }

  /** Fallback if webhook is delayed — safe to call after Stripe redirect */
  @Get('checkout/confirm')
  async confirmCheckout(@Query('session_id') sessionId: string) {
    if (!sessionId?.trim()) return { ok: false, error: 'session_id required' };
    if (!this.stripe.isEnabled()) return { ok: false, error: 'Stripe not configured' };
    let session: Awaited<ReturnType<StripeService['retrieveCheckoutSession']>>;
    try {
      session = await this.stripe.retrieveCheckoutSession(sessionId);
    } catch {
      throw new BadRequestException('Invalid or expired Stripe session');
    }
    const orderId = session.metadata?.orderId ?? session.client_reference_id;
    if (!orderId) return { ok: false, error: 'No order on session' };
    if (session.payment_status === 'paid') {
      await this.orders.markPaid(orderId, { stripeSessionId: session.id, paymentStatus: session.payment_status });
      return { ok: true, orderId };
    }
    return { ok: false, payment_status: session.payment_status };
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.orders.findById(id);
  }

  @Post(':id/mock-complete')
  async mockComplete(@Param('id') id: string) {
    if (this.config.get('STRIPE_SECRET_KEY')) {
      return { ok: false, error: 'Mock checkout disabled when STRIPE_SECRET_KEY is set' };
    }
    await this.orders.markPaid(id, { mock: true });
    return { ok: true, orderId: id };
  }
}
