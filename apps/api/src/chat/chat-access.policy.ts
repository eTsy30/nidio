import { Injectable, NotFoundException } from '@nestjs/common';

import { RelationshipService } from '../relationship/relationship.service';

import { ChatRepository } from './chat.repository';

@Injectable()
export class ChatAccessPolicy {
  constructor(
    private readonly chatRepository: ChatRepository,
    private readonly relationshipService: RelationshipService,
  ) {}

  async requireMessage(userId: string, messageId: string) {
    const workspaceId = await this.relationshipService.getWorkspaceId(userId);
    const message = await this.chatRepository.findAccessibleMessage(
      workspaceId,
      messageId,
    );

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    return { workspaceId, message };
  }

  async requireAuthorMessage(userId: string, messageId: string) {
    const access = await this.requireMessage(userId, messageId);

    if (access.message.senderId !== userId) {
      throw new NotFoundException('Message not found');
    }

    return access;
  }
}
