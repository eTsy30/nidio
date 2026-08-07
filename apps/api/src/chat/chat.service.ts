import { Injectable } from '@nestjs/common';

import { RelationshipService } from '../relationship/relationship.service';

import { AddReactionDto } from './dto/add-reaction.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { EditMessageDto } from './dto/edit-message.dto';
import { ChatRepository } from './chat.repository';

@Injectable()
export class ChatService {
  constructor(
    private readonly chatRepository: ChatRepository,
    private readonly relationshipService: RelationshipService,
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
      const replyMessage = await this.chatRepository.findMessageById(
        dto.replyToId,
      );

      if (!replyMessage) {
        throw new Error('Reply message not found.');
      }
    }

    return this.chatRepository.createMessage({
      workspaceId,
      senderId: userId,
      content: dto.content,
      ...(dto.replyToId ? { replyToId: dto.replyToId } : {}),
    });
  }

  /** Обновить текст сообщения. */
  async editMessage(messageId: string, dto: EditMessageDto) {
    if (!dto.content) {
      throw new Error('Message content is required.');
    }

    return this.chatRepository.updateMessage(messageId, dto.content);
  }

  /** Мягко удалить сообщение. */
  async deleteMessage(messageId: string) {
    return this.chatRepository.deleteMessage(messageId);
  }

  /** Добавить реакцию к сообщению. */
  async addReaction(userId: string, messageId: string, dto: AddReactionDto) {
    return this.chatRepository.addReaction(messageId, userId, dto.emoji);
  }

  /** Удалить реакцию с сообщения. */
  async removeReaction(userId: string, messageId: string, emoji: string) {
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
