import { Body, Controller, Get, Post } from '@nestjs/common';

import { Authorization } from '../auth/decorators/Authorization.decorator';
import { Authorized } from '../auth/decorators/authorized.decorator';

import { CalendarPushService } from './calendar-push.service';
import { PushEndpointDto, PushTimeZoneDto, SubscribePushDto } from './push.dto';
import { PushService } from './push.service';

@Controller('push')
@Authorization()
export class PushController {
  constructor(
    private readonly push: PushService,
    private readonly calendarPush: CalendarPushService,
  ) {}

  @Post('timezone')
  timeZone(@Authorized('id') userId: string, @Body() dto: PushTimeZoneDto) {
    return this.calendarPush.setTimeZone(userId, dto.timeZone);
  }

  @Get('config')
  config() {
    return { publicKey: this.push.publicKey };
  }

  @Post('subscribe')
  subscribe(@Authorized('id') userId: string, @Body() dto: SubscribePushDto) {
    return this.push.subscribe(userId, dto);
  }

  @Post('status')
  status(@Authorized('id') userId: string, @Body() dto: PushEndpointDto) {
    return this.push.status(userId, dto.endpoint);
  }

  @Post('unsubscribe')
  unsubscribe(@Authorized('id') userId: string, @Body() dto: PushEndpointDto) {
    return this.push.unsubscribe(userId, dto.endpoint);
  }
}
