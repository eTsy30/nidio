/// <reference types="jest" />
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import * as webPush from 'web-push';

import { PrismaService } from '../prisma/prisma.service';

import { PushService } from './push.service';

jest.mock('web-push', () => ({ sendNotification: jest.fn() }));

const mockAsync = () => jest.fn<Promise<unknown>, unknown[]>();

describe('Push notifications', () => {
  const prisma = {
    pushSubscription: {
      findMany: mockAsync(),
      deleteMany: mockAsync(),
      upsert: mockAsync(),
    },
    notificationAttempt: { create: mockAsync() },
  };
  const config = new ConfigService({
    VAPID_PUBLIC_KEY: 'public',
    VAPID_PRIVATE_KEY: 'private',
    VAPID_SUBJECT: 'mailto:test@example.com',
  });
  const service = new PushService(prisma as unknown as PrismaService, config);
  const devices = ['phone', 'desktop'].map((id) => ({
    id,
    endpoint: `https://fcm.googleapis.com/${id}`,
    p256dh: 'key',
    auth: 'auth',
  }));

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.pushSubscription.findMany.mockResolvedValue(devices);
    jest
      .mocked(webPush.sendNotification)
      .mockResolvedValue({ statusCode: 201, body: '', headers: {} });
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

  it('deduplicates calendar notifications independently on each device', async () => {
    prisma.notificationAttempt.create
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({});
    const payload = {
      title: 'Напоминание',
      body: 'Встреча',
      url: '/calendar',
      tag: 'event',
    };
    await service.notifyUser('partner', 'event:occurrence', payload);
    expect(webPush.sendNotification).toHaveBeenCalledTimes(2);
    prisma.notificationAttempt.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('duplicate', {
        code: 'P2002',
        clientVersion: '7',
      }),
    );
    await service.notifyUser('partner', 'event:occurrence', payload);
    expect(webPush.sendNotification).toHaveBeenCalledTimes(2);
  });
});
