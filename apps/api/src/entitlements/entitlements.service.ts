import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EntitlementsService {
  constructor(private readonly prisma: PrismaService) {}

  async getByDevice(deviceId: string) {
    if (!deviceId || deviceId.length < 8) {
      return { active: false, reason: 'invalid_device' as const };
    }
    const row = await this.prisma.entitlement.findUnique({ where: { deviceId } });
    if (!row) return { active: false, reason: 'none' as const };
    const now = new Date();
    if (row.validUntil <= now) return { active: false, reason: 'expired' as const, validUntil: row.validUntil };
    return {
      active: true,
      planTier: row.planTier,
      validUntil: row.validUntil,
    };
  }
}
