import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { Prisma } from '../../generated/prisma/client';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const resBody = exception.getResponse();
      return response
        .status(status)
        .json(typeof resBody === 'string' ? { statusCode: status, message: resBody } : resBody);
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      this.logger.error(`${exception.code} ${exception.message}`);
      if (['P1001', 'P1017'].includes(exception.code)) {
        return response.status(HttpStatus.SERVICE_UNAVAILABLE).json({
          statusCode: HttpStatus.SERVICE_UNAVAILABLE,
          message:
            'Database unreachable. Ensure Postgres is running, DATABASE_URL points to PostgreSQL, and migrations are applied (pnpm --filter api exec prisma migrate deploy).',
          code: exception.code,
        });
      }
      if (exception.code === 'P2021') {
        return response.status(HttpStatus.SERVICE_UNAVAILABLE).json({
          statusCode: HttpStatus.SERVICE_UNAVAILABLE,
          message:
            'Database schema is missing tables. Run: pnpm --filter api exec prisma migrate deploy',
          code: exception.code,
        });
      }
      return response.status(HttpStatus.BAD_GATEWAY).json({
        statusCode: HttpStatus.BAD_GATEWAY,
        message: 'Database error',
        code: exception.code,
      });
    }

    if (exception instanceof Prisma.PrismaClientInitializationError) {
      this.logger.error(exception.message);
      return response.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        message:
          'Database connection failed. Check DATABASE_URL (postgresql://…). On hosted Postgres, try appending ?sslmode=require.',
      });
    }

    const isDev = process.env.NODE_ENV !== 'production';
    if (exception instanceof Error) {
      this.logger.error(exception.stack ?? exception.message);
    } else {
      this.logger.error(String(exception));
    }

    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message:
        isDev && exception instanceof Error ? exception.message : 'Internal server error',
    });
  }
}
