import {
  Controller,
  Get,
  Header,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';

import { Authorized } from '../auth/decorators/authorized.decorator';
import { JwtGuards } from '../auth/guards/auth.guard';

import {
  BudgetQuery,
  LimitQuery,
  PageQuery,
  PeriodQuery,
} from './dto/finance-read.dto';
import { FinanceReadService } from './finance-read.service';

@Controller('finance')
@UseGuards(JwtGuards)
export class FinanceReadController {
  constructor(private readonly service: FinanceReadService) {}
  @Get('sections/:section')
  @Header('Cache-Control', 'private, no-store')
  section(@Authorized('id') user: string, @Param('section') section: string) {
    return this.service.section(user, section);
  }
  @Get('goal/:id')
  @Header('Cache-Control', 'private, no-store')
  goal(@Authorized('id') user: string, @Param('id') id: string) {
    return this.service.section(user, 'savings', id);
  }
  @Get('budget')
  @Header('Cache-Control', 'private, no-store')
  budget(@Authorized('id') user: string, @Query() query: BudgetQuery) {
    return this.service.budget(user, query);
  }
  @Get('budget-limits')
  @Header('Cache-Control', 'private, no-store')
  limits(@Authorized('id') user: string, @Query() query: LimitQuery) {
    return this.service.limits(user, query);
  }
  @Get('goal/:id/history')
  @Header('Cache-Control', 'private, no-store')
  history(
    @Authorized('id') user: string,
    @Param('id') id: string,
    @Query() query: PageQuery,
  ) {
    return this.service.history(user, id, query);
  }
  @Get('goal/:id/contribution')
  @Header('Cache-Control', 'private, no-store')
  contribution(
    @Authorized('id') user: string,
    @Param('id') id: string,
    @Query() query: PeriodQuery,
  ) {
    return this.service.contribution(user, id, query);
  }
}
