import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtGuards } from '../auth/guards/auth.guard';

import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksService } from './tasks.service';

@Controller('tasks')
@UseGuards(JwtGuards)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  create(@Body() dto: CreateTaskDto, @CurrentUser('id') userId: string) {
    return this.tasksService.create(dto, userId);
  }

  @Get()
  findAll(@CurrentUser('id') userId: string) {
    return this.tasksService.findAll(userId);
  }

  @Get('today')
  getToday(@CurrentUser('id') userId: string) {
    return this.tasksService.getTodayTasks(userId);
  }

  @Get('summary')
  getSummary(@CurrentUser('id') userId: string) {
    return this.tasksService.getSummary(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.tasksService.findOne(id, userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.tasksService.update(id, dto, userId);
  }

  @Patch(':id/move')
  move(
    @Param('id') id: string,
    @Body('columnId') columnId: string,
    @Body('order') order: number,
    @CurrentUser('id') userId: string,
  ) {
    return this.tasksService.moveTask(id, columnId, order, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    await this.tasksService.remove(id, userId);
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  complete(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.tasksService.complete(id, userId);
  }

  @Post(':id/nudge')
  @HttpCode(HttpStatus.OK)
  nudge(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.tasksService.nudge(id, userId);
  }
}
