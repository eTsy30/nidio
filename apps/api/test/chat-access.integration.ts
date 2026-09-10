import { NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import type { Socket } from 'socket.io';

import { ChatController } from '../src/chat/chat.controller';
import { ChatRepository } from '../src/chat/chat.repository';
import { ChatService } from '../src/chat/chat.service';
import { ChatAccessPolicy } from '../src/chat/chat-access.policy';
import { MessageType } from '../src/chat/enums/message-type.enum';
import { PrismaService } from '../src/prisma/prisma.service';
import { PushService } from '../src/push/push.service';
import { RealtimeGateway } from '../src/realtime/realtime.gateway';
import { RealtimeService } from '../src/realtime/realtime.service';
import { RelationshipService } from '../src/relationship/relationship.service';

async function main() {
  const databaseUrl = process.env.CHAT_ACCESS_TEST_DATABASE_URL;
  assert(
    databaseUrl && new URL(databaseUrl).pathname === '/chat_access_test',
    'Set CHAT_ACCESS_TEST_DATABASE_URL to an isolated chat_access_test database',
  );

  process.env.DATABASE_URL = databaseUrl;
  const prisma = new PrismaService();
  await prisma.$connect();

  const suffix = randomUUID();
  const createUser = (name: string) =>
    prisma.user.create({
      data: {
        email: `${suffix}-${name}@example.test`,
        firstName: name,
        passwordHash: 'test',
      },
    });
  const [alice, partner, outsider, outsiderPartner] = await Promise.all([
    createUser('alice'),
    createUser('partner'),
    createUser('outsider'),
    createUser('outsider-partner'),
  ]);
  const [firstCouple, secondCouple] = await Promise.all([
    prisma.couple.create({
      data: {
        members: { create: [{ userId: alice.id }, { userId: partner.id }] },
      },
    }),
    prisma.couple.create({
      data: {
        members: {
          create: [{ userId: outsider.id }, { userId: outsiderPartner.id }],
        },
      },
    }),
  ]);
  const [firstWorkspace, secondWorkspace] = await Promise.all([
    prisma.workspace.create({
      data: { type: 'COUPLE', title: 'First', coupleId: firstCouple.id },
    }),
    prisma.workspace.create({
      data: { type: 'COUPLE', title: 'Second', coupleId: secondCouple.id },
    }),
  ]);
  const firstMessage = await prisma.message.create({
    data: {
      workspaceId: firstWorkspace.id,
      senderId: alice.id,
      content: 'first message',
    },
  });
  const secondMessage = await prisma.message.create({
    data: {
      workspaceId: secondWorkspace.id,
      senderId: outsider.id,
      content: 'second message',
    },
  });

  const workspaceByUser = new Map([
    [alice.id, firstWorkspace.id],
    [partner.id, firstWorkspace.id],
    [outsider.id, secondWorkspace.id],
    [outsiderPartner.id, secondWorkspace.id],
  ]);
  const relationship = {
    getWorkspaceId: async (userId: string) => {
      const workspaceId = workspaceByUser.get(userId);
      if (!workspaceId) throw new NotFoundException('Workspace not found');
      return workspaceId;
    },
    getCurrentCouple: async (userId: string) => ({
      workspaceId: workspaceByUser.get(userId),
      partnerId: userId === outsider.id ? outsiderPartner.id : partner.id,
    }),
  } as unknown as RelationshipService;
  const repository = new ChatRepository(prisma);
  const policy = new ChatAccessPolicy(repository, relationship);
  const chat = new ChatService(
    { notifyMessage: async () => undefined } as unknown as PushService,
    repository,
    relationship,
    { get: async () => null } as never,
    policy,
  );
  const controller = new ChatController(chat);
  const broadcasts: unknown[] = [];
  const gateway = new RealtimeGateway(
    {} as PushService,
    {} as JwtService,
    {
      emitToWorkspace: (...args: unknown[]) => broadcasts.push(args),
    } as RealtimeService,
    relationship,
    chat,
  );

  try {
    await controller.editMessage(alice.id, firstMessage.id, {
      content: 'edited',
    });
    assert.equal(
      (
        await prisma.message.findUniqueOrThrow({
          where: { id: firstMessage.id },
        })
      ).content,
      'edited',
    );

    await assert.rejects(
      controller.editMessage(partner.id, firstMessage.id, {
        content: 'forbidden',
      }),
      NotFoundException,
    );
    await assert.rejects(
      controller.editMessage(outsider.id, firstMessage.id, {
        content: 'foreign',
      }),
      NotFoundException,
    );
    assert.equal(
      (
        await prisma.message.findUniqueOrThrow({
          where: { id: firstMessage.id },
        })
      ).content,
      'edited',
    );

    const outsiderSocket = { data: { user: { sub: outsider.id } } } as Socket;
    await assert.rejects(
      gateway.handleChatDelete(outsiderSocket, { messageId: firstMessage.id }),
      NotFoundException,
    );
    assert.equal(
      (
        await prisma.message.findUniqueOrThrow({
          where: { id: firstMessage.id },
        })
      ).deletedAt,
      null,
    );
    assert.equal(broadcasts.length, 0);

    await assert.rejects(
      controller.createMessage(outsider.id, {
        clientId: `${suffix}-reply`,
        type: MessageType.TEXT,
        content: 'foreign reply',
        replyToId: firstMessage.id,
      }),
      NotFoundException,
    );
    await assert.rejects(
      gateway.handleReactionAdd(outsiderSocket, {
        messageId: firstMessage.id,
        dto: { emoji: '❤️' },
      }),
      NotFoundException,
    );
    assert.equal(
      await prisma.messageReaction.count({
        where: { messageId: firstMessage.id },
      }),
      0,
    );

    await controller.addReaction(partner.id, firstMessage.id, { emoji: '❤️' });
    await gateway.handleChatSend(
      { data: { user: { sub: partner.id } } } as Socket,
      {
        clientId: `${suffix}-allowed-reply`,
        type: MessageType.TEXT,
        content: 'allowed reply',
        replyToId: firstMessage.id,
      },
    );
    assert.equal(
      await prisma.messageReaction.count({
        where: { messageId: firstMessage.id, userId: partner.id },
      }),
      1,
    );
    assert.equal(
      await prisma.message.count({ where: { replyToId: firstMessage.id } }),
      1,
    );
    assert.equal(
      (
        await prisma.message.findUniqueOrThrow({
          where: { id: secondMessage.id },
        })
      ).content,
      'second message',
    );
    process.stdout.write('Chat access integration: PASS\n');
  } finally {
    await prisma.workspace.deleteMany({
      where: { id: { in: [firstWorkspace.id, secondWorkspace.id] } },
    });
    await prisma.couple.deleteMany({
      where: { id: { in: [firstCouple.id, secondCouple.id] } },
    });
    await prisma.user.deleteMany({
      where: {
        id: { in: [alice.id, partner.id, outsider.id, outsiderPartner.id] },
      },
    });
    await prisma.$disconnect();
  }
}

void main();
