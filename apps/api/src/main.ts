import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { json } from 'express';
import rateLimit from 'express-rate-limit';

import { originValidator } from './config/origin';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: originValidator,
    credentials: true,
  });

  app.use(cookieParser());
  app.use(json({ limit: '10mb' }));
  app.use(
    '/auth/login',
    rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true }),
  );
  app.use(
    '/auth/register',
    rateLimit({ windowMs: 60 * 60 * 1000, limit: 5, standardHeaders: true }),
  );
  app.use(
    ['/auth/forgot-password', '/auth/reset-password'],
    rateLimit({ windowMs: 15 * 60 * 1000, limit: 5, standardHeaders: true }),
  );
  app.use(
    '/auth/refresh',
    rateLimit({ windowMs: 60 * 1000, limit: 30, standardHeaders: true }),
  );
  app.use(
    '/chat',
    rateLimit({ windowMs: 60 * 1000, limit: 60, standardHeaders: true }),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen(process.env.PORT || 4000);
}
bootstrap();
