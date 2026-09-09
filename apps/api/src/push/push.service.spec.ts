/// <reference types="jest" />
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import * as webPush from 'web-push';

import { PrismaService } from '../prisma/prisma.service';

import { chatPushBody, PushService } from './push.service';

jest.mock('web-push', () => ({ sendNotification: jest.fn() }));

const mockAsync = () => jest.fn<Promise<unknown>, unknown[]>();

describe('Chat push', () => {
  const prisma = {
    message: { findUnique: mockAsync() },
    pushSubscription: {
      findMany: mockAsync(),
      deleteMany: mockAsync(),
      upsert: mockAsync(),
    },
    pushDelivery: { create: mockAsync() },
    chatPresence: {
      findFirst: mockAsync(),
      deleteMany: mockAsync(),
      upsert: mockAsync(),
    },
  };
  const config = new ConfigService({
    VAPID_PUBLIC_KEY: 'public',
    VAPID_PRIVATE_KEY: 'private',
    VAPID_SUBJECT: 'mailto:test@example.com',
  });
  const service = new PushService(prisma as unknown as PrismaService, config);
  const message = {
    id: 'message',
    senderId: 'author',
    content: 'Привет!',
    type: 'TEXT',
    deletedAt: null,
    workspaceId: 'workspace',
    sender: { firstName: 'Аня' },
    attachments: [],
    workspace: {
      couple: {
        deletedAt: null,
        members: [{ userId: 'author' }, { userId: 'partner' }],
      },
    },
  };
  const devices = ['phone', 'desktop'].map((id) => ({
    id,
    endpoint: `https://fcm.googleapis.com/${id}`,
    p256dh: 'key',
    auth: 'auth',
  }));

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.message.findUnique.mockResolvedValue(message);
    prisma.chatPresence.findFirst.mockResolvedValue(null);
    prisma.pushSubscription.findMany.mockResolvedValue(devices);
    prisma.pushDelivery.create.mockResolvedValue({});
    jest
      .mocked(webPush.sendNotification)
      .mockResolvedValue({ statusCode: 201, body: '', headers: {} });
  });

  it('sends name/text to all partner devices, never the author', async () => {
    await service.notifyMessage('message');
    expect(prisma.pushSubscription.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.pushSubscription.findMany).toHaveBeenCalledWith({
      where: { userId: 'partner' },
    });
    expect(webPush.sendNotification).toHaveBeenCalledTimes(2);
    const payload = JSON.parse(
      jest.mocked(webPush.sendNotification).mock.calls[0]![1] as string,
    );
    expect(payload).toEqual({
      title: 'Аня',
      body: 'Привет!',
      tag: 'chat:message',
      url: '/chat',
    });
  });

  it('suppresses all devices while the recipient reads this workspace', async () => {
    prisma.chatPresence.findFirst.mockResolvedValue({ socketId: 'active' });
    await service.notifyMessage('message');
    expect(webPush.sendNotification).not.toHaveBeenCalled();
    expect(prisma.chatPresence.findFirst).toHaveBeenCalledWith({
      where: {
        userId: 'partner',
        workspaceId: 'workspace',
        expiresAt: { gt: expect.any(Date) },
      },
    });
  });

  it('does not send without subscriptions', async () => {
    prisma.pushSubscription.findMany.mockResolvedValue([]);
    await service.notifyMessage('message');
    expect(webPush.sendNotification).not.toHaveBeenCalled();
  });

  it('skips a message/device already claimed by another request', async () => {
    prisma.pushDelivery.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('duplicate', {
        code: 'P2002',
        clientVersion: '7',
      }),
    );
    await service.notifyMessage('message');
    expect(webPush.sendNotification).not.toHaveBeenCalled();
  });

  it.each([404, 410])(
    'removes expired subscriptions for status %s',
    async (statusCode) => {
      jest.mocked(webPush.sendNotification).mockRejectedValue({ statusCode });
      await service.notifyMessage('message');
      expect(prisma.pushSubscription.deleteMany).toHaveBeenCalledTimes(2);
    },
  );

  it('isolates a failing device from other devices', async () => {
    jest
      .mocked(webPush.sendNotification)
      .mockRejectedValueOnce({ statusCode: 503 });
    await expect(service.notifyMessage('message')).resolves.toBeUndefined();
    expect(webPush.sendNotification).toHaveBeenCalledTimes(2);
    expect(prisma.pushSubscription.deleteMany).not.toHaveBeenCalled();
  });

  it('ignores deleted messages and disconnected couples', async () => {
    prisma.message.findUnique.mockResolvedValue({
      ...message,
      deletedAt: new Date(),
    });
    await service.notifyMessage('message');
    prisma.message.findUnique.mockResolvedValue({
      ...message,
      workspace: { couple: null },
    });
    await service.notifyMessage('message');
    expect(webPush.sendNotification).not.toHaveBeenCalled();
  });

  it('rejects arbitrary push URLs to protect the server from SSRF', async () => {
    await expect(
      service.subscribe('partner', {
        endpoint: 'https://127.0.0.1/internal',
        keys: { auth: 'auth', p256dh: 'key' },
      }),
    ).rejects.toThrow('Unsupported push endpoint');
    expect(prisma.pushSubscription.upsert).not.toHaveBeenCalled();
  });

  it('clears presence when a tab becomes inactive', async () => {
    await service.setPresence('socket', 'partner', 'workspace', false);
    expect(prisma.chatPresence.deleteMany).toHaveBeenCalledWith({
      where: { socketId: 'socket' },
    });
    expect(prisma.chatPresence.upsert).not.toHaveBeenCalled();
  });

  it('uses attachment labels and limits preview size', () => {
    expect(
      chatPushBody({ content: null, attachments: [{ type: 'IMAGE' }] }),
    ).toBe('Отправил(а) фото');
    expect(chatPushBody({ content: '', attachments: [{ type: 'FILE' }] })).toBe(
      'Отправил(а) файл',
    );
    expect(
      chatPushBody({ content: 'x'.repeat(1000), attachments: [] }),
    ).toHaveLength(500);
  });
});
