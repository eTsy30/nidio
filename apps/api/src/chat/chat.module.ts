import { forwardRef, Module } from '@nestjs/common';

import { LinkPreviewService } from '../link-preview/link-preview.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PushModule } from '../push/push.module';
import { RelationshipModule } from '../relationship/relationship.module';

import { ChatController } from './chat.controller';
import { ChatRepository } from './chat.repository';
import { ChatService } from './chat.service';
import { ChatAccessPolicy } from './chat-access.policy';

@Module({
  imports: [PushModule, PrismaModule, forwardRef(() => RelationshipModule)],
  controllers: [ChatController],
  providers: [
    ChatService,
    ChatRepository,
    ChatAccessPolicy,
    LinkPreviewService,
  ],
  exports: [ChatService],
})
export class ChatModule {}
