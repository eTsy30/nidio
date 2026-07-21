import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from './auth/auth.module';
import { EmailModule } from './email/email.module';
import { PrismaModule } from './prismas/prisma.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    PrismaModule,

    AuthModule,

    EmailModule,
  ],
})
export class AppModule {}
