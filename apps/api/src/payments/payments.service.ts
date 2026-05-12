import { Injectable } from '@nestjs/common';
import * as crypto from 'node:crypto';

/** Local dev only — no Stripe keys */
export type MockPrepayPayload = {
  mode: 'mock';
  sdkParams?: Record<string, unknown>;
};

@Injectable()
export class PaymentsService {
  buildMockPrepay(orderId: string, amountCents: number, deviceId: string): MockPrepayPayload {
    const mockToken = crypto.randomBytes(16).toString('hex');
    return {
      mode: 'mock',
      sdkParams: {
        orderId,
        amountCents,
        deviceId,
        mockToken,
        hint: 'POST /orders/:id/mock-complete (local mock checkout)',
      },
    };
  }
}
