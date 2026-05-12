import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { EntitlementsService } from './entitlements.service';

@Controller('entitlements')
export class EntitlementsController {
  constructor(private readonly entitlements: EntitlementsService) {}

  @Get('me')
  async me(@Query('deviceId') deviceId: string) {
    if (!deviceId || deviceId.length < 8) {
      throw new BadRequestException('deviceId query required (min 8 chars)');
    }
    return this.entitlements.getByDevice(deviceId);
  }
}
