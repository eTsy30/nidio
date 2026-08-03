import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { RelationshipModule } from '../relationship/relationship.module';

import { ChatController } from './chat.controller';
import { ChatRepository } from './chat.repository';
import { ChatService } from './chat.service';

@Module({
  imports: [PrismaModule, RelationshipModule],
  controllers: [ChatController],
  providers: [ChatService, ChatRepository],
  exports: [ChatService],
})
export class ChatModule {}
