import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { PlanTier } from '@spirit-talker/shared';

const PLAN_VALUES = Object.values(PlanTier);

export class CreateOrderDto {
  @IsString()
  @MinLength(8)
  deviceId!: string;

  @IsIn(PLAN_VALUES)
  tier!: PlanTier;

  /** Public web origin for Stripe redirects (must match WEB_APP_URL allow-list in production) */
  @IsOptional()
  @IsString()
  webAppUrl?: string;
}
