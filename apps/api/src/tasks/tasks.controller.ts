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
  Query,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtGuards } from '../auth/guards/auth.guard';

import { CreateTaskDto } from './dto/create-task.dto';
import { MoveTaskDto } from './dto/move-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksService } from './tasks.service';

type TaskDeleteMode = 'THIS' | 'FOLLOWING';

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
    @Body() dto: MoveTaskDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.tasksService.moveTask(id, dto.columnId, dto.order, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @Query('mode') mode: TaskDeleteMode = 'THIS',
    @CurrentUser('id') userId: string,
  ) {
    const normalizedMode = mode === 'FOLLOWING' ? 'FOLLOWING' : 'THIS';

    await this.tasksService.remove(id, userId, normalizedMode);
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  complete(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.tasksService.complete(id, userId);
  }

  @Post(':id/activate')
  @HttpCode(HttpStatus.OK)
  activate(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.tasksService.activate(id, userId);
  }

  @Post(':id/nudge')
  @HttpCode(HttpStatus.OK)
  nudge(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.tasksService.nudge(id, userId);
  }
}
