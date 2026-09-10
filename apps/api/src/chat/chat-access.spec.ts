/// <reference types="jest" />
import { NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import type { Socket } from 'socket.io';

import { LinkPreviewService } from '../link-preview/link-preview.service';
import { PrismaService } from '../prisma/prisma.service';
import { PushService } from '../push/push.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { RealtimeService } from '../realtime/realtime.service';
import { RelationshipService } from '../relationship/relationship.service';

import { MessageType } from './enums/message-type.enum';
import { ChatController } from './chat.controller';
import { ChatRepository } from './chat.repository';
import { ChatService } from './chat.service';
import { ChatAccessPolicy } from './chat-access.policy';

describe('Chat access', () => {
  const message = {
    id: 'm',
    workspaceId: 'pair-a',
    senderId: 'alice',
    deletedAt: null,
  };
  let controller: ChatController;
  let gateway: RealtimeGateway;
  const prisma = {
    message: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    messageReaction: { create: jest.fn(), delete: jest.fn() },
  };
  const notifyMessage = jest.fn();
  const preview = jest.fn();
  const emitToWorkspace = jest.fn();

  beforeEach(async () => {
    jest.resetAllMocks();
    prisma.message.findFirst.mockImplementation(async ({ where }) =>
      where.workspaceId === 'pair-a' ? message : null,
    );
    prisma.message.update.mockResolvedValue(message);
    prisma.message.create.mockResolvedValue(message);
    prisma.message.findUnique.mockResolvedValue(null);
    const module = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [
        ChatService,
        ChatRepository,
        ChatAccessPolicy,
        RealtimeGateway,
        { provide: PrismaService, useValue: prisma },
        { provide: PushService, useValue: { notifyMessage } },
        { provide: LinkPreviewService, useValue: { get: preview } },
        { provide: JwtService, useValue: {} },
        { provide: RealtimeService, useValue: { emitToWorkspace } },
        {
          provide: RelationshipService,
          useValue: {
            getWorkspaceId: jest.fn(async (id: string) =>
              id === 'outsider' ? 'pair-b' : 'pair-a',
            ),
            getCurrentCouple: jest.fn(async () => ({ workspaceId: 'pair-a' })),
          },
        },
      ],
    }).compile();
    controller = module.get(ChatController);
    gateway = module.get(RealtimeGateway);
  });

  for (const transport of ['REST', 'WS'] as const) {
    for (const action of ['edit', 'delete'] as const) {
      const invoke = (actor: string) => {
        if (transport === 'REST')
          return action === 'edit'
            ? controller.editMessage(actor, 'm', { content: 'new' })
            : controller.deleteMessage(actor, 'm');
        const socket = { data: { user: { sub: actor } } } as Socket;
        return action === 'edit'
          ? gateway.handleChatEdit(socket, {
              messageId: 'm',
              dto: { content: 'new' },
            })
          : gateway.handleChatDelete(socket, { messageId: 'm' });
      };
      it(`${transport} ${action}: author may mutate with scoped query`, async () => {
        await invoke('alice');
        expect(prisma.message.findFirst).toHaveBeenCalledWith({
          where: { id: 'm', workspaceId: 'pair-a', deletedAt: null },
          select: { id: true, senderId: true },
        });
        expect(prisma.message.update).toHaveBeenCalledWith(
          expect.objectContaining({
            where: {
              id: 'm',
              workspaceId: 'pair-a',
              senderId: 'alice',
              deletedAt: null,
            },
          }),
        );
      });
      for (const actor of ['partner', 'outsider']) {
        it(`${transport} ${action}: rejects ${actor} without mutation or broadcast`, async () => {
          await expect(invoke(actor)).rejects.toBeInstanceOf(NotFoundException);
          expect(prisma.message.update).not.toHaveBeenCalled();
          expect(emitToWorkspace).not.toHaveBeenCalled();
        });
      }
      it(`${transport} ${action}: rejects missing/deleted messages`, async () => {
        for (const result of [null, null]) {
          prisma.message.findFirst.mockResolvedValue(result);
          await expect(invoke('alice')).rejects.toBeInstanceOf(
            NotFoundException,
          );
        }
        expect(prisma.message.update).not.toHaveBeenCalled();
      });
    }
  }

  it('WS without authenticated user cannot edit/delete', async () => {
    const socket = { data: {} } as Socket;
    await gateway.handleChatEdit(socket, {
      messageId: 'm',
      dto: { content: 'new' },
    });
    await gateway.handleChatDelete(socket, { messageId: 'm' });
    expect(prisma.message.findFirst).not.toHaveBeenCalled();
    expect(prisma.message.update).not.toHaveBeenCalled();
    expect(emitToWorkspace).not.toHaveBeenCalled();
  });
  for (const transport of ['REST', 'WS'] as const) {
    for (const action of ['reply', 'add', 'remove'] as const) {
      const invoke = (actor: string) => {
        const dto = {
          content: 'https://example.test',
          replyToId: 'm',
          clientId: 'c',
          type: MessageType.TEXT,
        };
        if (transport === 'REST') {
          if (action === 'reply') return controller.createMessage(actor, dto);
          if (action === 'add')
            return controller.addReaction(actor, 'm', { emoji: '❤️' });
          return controller.removeReaction(actor, 'm', '❤️');
        }
        const socket = { data: { user: { sub: actor } } } as Socket;
        if (action === 'reply') return gateway.handleChatSend(socket, dto);
        if (action === 'add')
          return gateway.handleReactionAdd(socket, {
            messageId: 'm',
            dto: { emoji: '❤️' },
          });
        return gateway.handleReactionRemove(socket, {
          messageId: 'm',
          emoji: '❤️',
        });
      };
      it(`${transport} ${action}: partner may act on accessible message`, async () => {
        await invoke('partner');
        if (action === 'reply')
          expect(prisma.message.create).toHaveBeenCalled();
        else if (action === 'add')
          expect(prisma.messageReaction.create).toHaveBeenCalledWith({
            data: { messageId: 'm', userId: 'partner', emoji: '❤️' },
          });
        else
          expect(prisma.messageReaction.delete).toHaveBeenCalledWith({
            where: {
              messageId_userId_emoji: {
                messageId: 'm',
                userId: 'partner',
                emoji: '❤️',
              },
            },
          });
      });
      for (const state of ['foreign', 'missing', 'deleted'] as const) {
        it(`${transport} ${action}: rejects ${state} before effects`, async () => {
          if (state === 'missing')
            prisma.message.findFirst.mockResolvedValue(null);
          if (state === 'deleted')
            prisma.message.findFirst.mockResolvedValue(null);
          await expect(
            invoke(state === 'foreign' ? 'outsider' : 'partner'),
          ).rejects.toBeInstanceOf(NotFoundException);
          expect(prisma.message.create).not.toHaveBeenCalled();
          expect(prisma.messageReaction.create).not.toHaveBeenCalled();
          expect(prisma.messageReaction.delete).not.toHaveBeenCalled();
          expect(notifyMessage).not.toHaveBeenCalled();
          expect(preview).not.toHaveBeenCalled();
          expect(emitToWorkspace).not.toHaveBeenCalled();
        });
      }
    }
  }
});
