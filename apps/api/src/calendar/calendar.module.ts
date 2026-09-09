import { Module } from '@nestjs/common';

import { PushModule } from '../push/push.module';

import { CalendarResolver } from './calendar.resolver';
import { CalendarService } from './calendar.service';

@Module({
  imports: [PushModule],
  providers: [CalendarService, CalendarResolver],
})
export class CalendarModule {}
