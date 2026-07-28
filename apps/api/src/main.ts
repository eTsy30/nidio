import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    // ебучая корса !!!
    origin: process.env.FRONTEND_URL,
    credentials: true,
  });
  app.use(cookieParser());
  const port = Number(process.env.PORT) || 3001;

  await app.listen(port);

  Logger.log(`🚀 API: http://localhost:${port}`);
}

bootstrap();
