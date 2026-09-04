import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtGuards } from '../auth/guards/auth.guard';

import { TemplatesService } from './templates.service';

@Controller('templates')
@UseGuards(JwtGuards)
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get()
  getAll(@CurrentUser('id') userId: string) {
    return this.templatesService.getAll(userId);
  }

  @Post(':id/apply')
  apply(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.templatesService.applyTemplate(id, userId);
  }

  @Post('from-column')
  createFromColumn(
    @Body('columnId') columnId: string,
    @Body('title') title: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.templatesService.createCustomTemplate(userId, columnId, title);
  }
}
