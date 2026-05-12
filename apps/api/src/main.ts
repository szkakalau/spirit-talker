import './load-env';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  app.useGlobalFilters(new AllExceptionsFilter());
  const rawOrigins = process.env.CORS_ORIGIN ?? 'http://localhost:5173';
  const originList = rawOrigins.split(',').map((s) => s.trim()).filter(Boolean);
  app.enableCors({
    origin: originList.length ? originList : true,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
}
bootstrap();
