import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { LinkPreviewService } from '../link-preview/link-preview.service';
import { PushService } from '../push/push.service';
import { RelationshipService } from '../relationship/relationship.service';

import { AddReactionDto } from './dto/add-reaction.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { EditMessageDto } from './dto/edit-message.dto';
import { ChatRepository } from './chat.repository';
import { ChatAccessPolicy } from './chat-access.policy';

@Injectable()
export class ChatService {
  constructor(
    private readonly pushService: PushService,
    private readonly chatRepository: ChatRepository,
    private readonly relationshipService: RelationshipService,
    private readonly linkPreviewService: LinkPreviewService,
    private readonly chatAccessPolicy: ChatAccessPolicy,
  ) {}

  async getMessages(userId: string, cursor?: string, limit = 20) {
    const workspaceId = await this.relationshipService.getWorkspaceId(userId);

    const messages = await this.chatRepository.findMessages(
      workspaceId,
      cursor,
      limit,
    );

    for (const message of messages) {
      if (message.senderId !== userId && !message.deliveredAt) {
        await this.chatRepository.markDelivered(message.id);
      }
    }

    const lastMessage = messages.at(-1);

    return {
      messages,
      nextCursor: lastMessage?.id ?? null,
      hasMore: messages.length === limit,
    };
  }

  async sendMessage(userId: string, dto: CreateMessageDto) {
    const result = await this.sendMessageWithResult(userId, dto);
    return result.message;
  }

  async sendMessageWithResult(userId: string, dto: CreateMessageDto) {
    const workspaceId = await this.relationshipService.getWorkspaceId(userId);
    if (!dto.content) {
      throw new Error('Message content is required.');
    }

    if (dto.replyToId) {
      await this.chatAccessPolicy.requireMessage(userId, dto.replyToId);
    }

    const existing = await this.chatRepository.findMessageByClientId(
      dto.clientId,
    );
    if (existing) {
      if (
        existing.workspaceId === workspaceId &&
        existing.senderId === userId
      ) {
        return { message: existing, created: false };
      }

      throw new Error('Message client ID is already in use.');
    }

    const url = dto.content.match(/https?:\/\/[^\s]+/)?.[0];
    const preview = url ? await this.linkPreviewService.get(url) : null;

    let message;
    try {
      message = await this.chatRepository.createMessage({
        workspaceId,
        senderId: userId,
        content: dto.content,
        clientId: dto.clientId,
        ...(preview ? { metadata: { linkPreview: preview } } : {}),
        ...(dto.replyToId ? { replyToId: dto.replyToId } : {}),
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const duplicate = await this.chatRepository.findMessageByClientId(
          dto.clientId,
        );
        if (
          duplicate &&
          duplicate.workspaceId === workspaceId &&
          duplicate.senderId === userId
        ) {
          return { message: duplicate, created: false };
        }
      }
      throw error;
    }
    void this.pushService.notifyMessage(message.id);
    return { message, created: true };
  }
  async editMessage(userId: string, messageId: string, dto: EditMessageDto) {
    if (!dto.content) {
      throw new Error('Message content is required.');
    }

    const { workspaceId } = await this.chatAccessPolicy.requireAuthorMessage(
      userId,
      messageId,
    );
    return this.chatRepository.updateMessage(
      messageId,
      dto.content,
      workspaceId,
      userId,
    );
  }
  async deleteMessage(userId: string, messageId: string) {
    const { workspaceId } = await this.chatAccessPolicy.requireAuthorMessage(
      userId,
      messageId,
    );
    return this.chatRepository.deleteMessage(messageId, workspaceId, userId);
  }
  async addReaction(userId: string, messageId: string, dto: AddReactionDto) {
    await this.chatAccessPolicy.requireMessage(userId, messageId);
    return this.chatRepository.addReaction(messageId, userId, dto.emoji);
  }
  async removeReaction(userId: string, messageId: string, emoji: string) {
    await this.chatAccessPolicy.requireMessage(userId, messageId);
    return this.chatRepository.removeReaction(messageId, userId, emoji);
  }
  async markRead(messageIds: string[], workspaceId: string, userId: string) {
    const updatedIds: string[] = [];

    for (const messageId of messageIds) {
      const message = await this.chatRepository.canUpdateStatus(
        messageId,
        workspaceId,
        userId,
      );

      if (!message || message.readAt) {
        continue;
      }

      await this.chatRepository.markRead(messageId);
      updatedIds.push(messageId);
    }

    return updatedIds;
  }
  async markDelivered(messageId: string, workspaceId: string, userId: string) {
    const message = await this.chatRepository.canUpdateStatus(
      messageId,
      workspaceId,
      userId,
    );

    if (!message || message.deliveredAt) {
      return message;
    }

    return this.chatRepository.markDelivered(messageId);
  }
  async typing(userId: string) {
    return {
      userId,
      typing: true,
    };
  }
}
