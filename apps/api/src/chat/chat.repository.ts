import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMessages(workspaceId: string, cursor?: string, limit = 20) {
    return this.prisma.message.findMany({
      where: {
        workspaceId,
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      ...(cursor
        ? {
            skip: 1,
            cursor: {
              id: cursor,
            },
          }
        : {}),
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            avatarUrl: true,
          },
        },
        replyTo: {
          select: {
            id: true,

            content: true,

            sender: {
              select: {
                id: true,

                firstName: true,
              },
            },
          },
        },
        attachments: true,
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
              },
            },
          },
        },
      },
    });
  }

  async findMessageById(id: string) {
    return this.prisma.message.findUnique({
      where: { id },
    });
  }

  async createMessage(data: {
    workspaceId: string;
    senderId: string;
    content: string;
    replyToId?: string;
    clientId?: string;
  }) {
    return this.prisma.message.create({
      data: {
        workspaceId: data.workspaceId,
        senderId: data.senderId,
        content: data.content,
        ...(data.clientId ? { clientId: data.clientId } : {}),
        ...(data.replyToId ? { replyToId: data.replyToId } : {}),
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            avatarUrl: true,
          },
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            sender: {
              select: {
                id: true,
                firstName: true,
              },
            },
          },
        },
        attachments: true,
        reactions: true,
      },
    });
  }

  async updateMessage(id: string, content: string) {
    return this.prisma.message.update({
      where: { id },
      data: {
        content,
        editedAt: new Date(),
      },
    });
  }

  async deleteMessage(id: string) {
    return this.prisma.message.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async addReaction(messageId: string, userId: string, emoji: string) {
    return this.prisma.messageReaction.create({
      data: {
        messageId,
        userId,
        emoji,
      },
    });
  }

  async removeReaction(messageId: string, userId: string, emoji: string) {
    return this.prisma.messageReaction.delete({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId,
          emoji,
        },
      },
    });
  }

  async canUpdateStatus(
    messageId: string,
    workspaceId: string,
    userId: string,
  ) {
    return this.prisma.message.findFirst({
      where: {
        id: messageId,
        workspaceId,
        senderId: {
          not: userId,
        },
      },
      select: {
        id: true,
        deliveredAt: true,
        readAt: true,
      },
    });
  }

  /** Отметить сообщение как доставленное. */
  async markDelivered(messageId: string) {
    return this.prisma.message.updateMany({
      where: {
        id: messageId,
        deliveredAt: null,
      },
      data: {
        deliveredAt: new Date(),
      },
    });
  }

  /** Отметить сообщение как прочитанное. */
  async markRead(messageId: string) {
    return this.prisma.message.updateMany({
      where: {
        id: messageId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });
  }
}
