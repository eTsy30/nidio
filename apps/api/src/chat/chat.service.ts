import { Injectable } from '@nestjs/common';

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
    const workspaceId = await this.relationshipService.getWorkspaceId(userId);
    if (!dto.content) {
      throw new Error('Message content is required.');
    }

    if (dto.replyToId) {
      await this.chatAccessPolicy.requireMessage(userId, dto.replyToId);
    }

    const url = dto.content.match(/https?:\/\/[^\s]+/)?.[0];
    const preview = url ? await this.linkPreviewService.get(url) : null;

    const message = await this.chatRepository.createMessage({
      workspaceId,
      senderId: userId,
      content: dto.content,
      ...(preview ? { metadata: { linkPreview: preview } } : {}),
      ...(dto.replyToId ? { replyToId: dto.replyToId } : {}),
    });
    void this.pushService.notifyMessage(message.id);
    return message;
  }

  /** Обновить текст сообщения. */
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

  /** Мягко удалить сообщение. */
  async deleteMessage(userId: string, messageId: string) {
    const { workspaceId } = await this.chatAccessPolicy.requireAuthorMessage(
      userId,
      messageId,
    );
    return this.chatRepository.deleteMessage(messageId, workspaceId, userId);
  }

  /** Добавить реакцию к сообщению. */
  async addReaction(userId: string, messageId: string, dto: AddReactionDto) {
    await this.chatAccessPolicy.requireMessage(userId, messageId);
    return this.chatRepository.addReaction(messageId, userId, dto.emoji);
  }

  /** Удалить реакцию с сообщения. */
  async removeReaction(userId: string, messageId: string, emoji: string) {
    await this.chatAccessPolicy.requireMessage(userId, messageId);
    return this.chatRepository.removeReaction(messageId, userId, emoji);
  }

  /** Отметить сообщение как прочитанное. */
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

  /** Отметить сообщение как доставленное. */
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

  /** Событие набора текста. Пока ничего не сохраняется в БД. */
  async typing(userId: string) {
    return {
      userId,
      typing: true,
    };
  }
}
