import { Injectable, NotFoundException } from '@nestjs/common';
import { PlanTier, PaymentChannel, PLAN_PRICES_USD_CENTS, PLAN_DURATION_DAYS } from '@spirit-talker/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(deviceId: string, tier: PlanTier) {
    const amountCents = PLAN_PRICES_USD_CENTS[tier];
    await this.prisma.device.upsert({
      where: { deviceId },
      create: { deviceId },
      update: {},
    });

    const order = await this.prisma.order.create({
      data: {
        deviceId,
        tier,
        channel: PaymentChannel.STRIPE,
        amountCents,
        currency: 'usd',
        status: 'PENDING',
      },
    });

    return { order, amountCents };
  }

  async attachStripeSession(orderId: string, stripeCheckoutSessionId: string) {
    await this.prisma.order.update({
      where: { id: orderId },
      data: { stripeCheckoutSessionId },
    });
  }

  async findById(id: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async findByStripeSessionId(sessionId: string) {
    return this.prisma.order.findFirst({
      where: { stripeCheckoutSessionId: sessionId },
    });
  }

  async markPaid(orderId: string, prepayParams?: object) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status === 'PAID') return order;

    const tier = order.tier as PlanTier;
    const days = PLAN_DURATION_DAYS[tier];
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + days);

    await this.prisma.$transaction([
      this.prisma.order.update({
        where: { id: orderId },
        data: { status: 'PAID', prepayParams: prepayParams ?? undefined },
      }),
      this.prisma.entitlement.upsert({
        where: { deviceId: order.deviceId },
        create: {
          deviceId: order.deviceId,
          planTier: order.tier,
          validUntil,
        },
        update: {
          planTier: order.tier,
          validUntil,
        },
      }),
    ]);

    return this.prisma.order.findUnique({ where: { id: orderId } });
  }
}
