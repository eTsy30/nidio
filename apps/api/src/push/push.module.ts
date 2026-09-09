import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from '../prisma/prisma.module';

import { CalendarPushService } from './calendar-push.service';
import { PushController } from './push.controller';
import { PushService } from './push.service';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [PushController],
  providers: [PushService, CalendarPushService],
  exports: [PushService, CalendarPushService],
})
export class PushModule {}
