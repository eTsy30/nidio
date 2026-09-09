import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { PushModule } from '../push/push.module';
import { RelationshipModule } from '../relationship/relationship.module';

import { TaskOverdueService } from './task-overdue.service';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

@Module({
  imports: [PrismaModule, RelationshipModule, PushModule],
  controllers: [TasksController],
  providers: [TasksService, TaskOverdueService],
  exports: [TasksService],
})
export class TasksModule {}
