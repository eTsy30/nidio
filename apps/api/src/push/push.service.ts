import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import * as webPush from 'web-push';

import { PrismaService } from '../prisma/prisma.service';

import { SubscribePushDto } from './push.dto';

export function chatPushBody(message: {
  content: string | null;
  attachments: { type: string }[];
}) {
  if (message.content?.trim()) return message.content.slice(0, 500);
  return message.attachments.some((attachment) => attachment.type === 'IMAGE')
    ? 'Отправил(а) фото'
    : 'Отправил(а) файл';
}

export type NotificationPayload = {
  title: string;
  body: string;
  url: string;
  tag: string;
};

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  get publicKey(): string | null {
    return this.config.get<string>('VAPID_PRIVATE_KEY') &&
      this.config.get<string>('VAPID_SUBJECT')
      ? (this.config.get<string>('VAPID_PUBLIC_KEY') ?? null)
      : null;
  }

  async subscribe(userId: string, dto: SubscribePushDto) {
    if (!this.publicKey)
      throw new ServiceUnavailableException('Push is not configured');
    // Only browser push providers: never send server requests to arbitrary subscriber URLs.
    const url = new URL(dto.endpoint);
    const allowed =
      url.hostname === 'fcm.googleapis.com' ||
      url.hostname === 'updates.push.services.mozilla.com' ||
      url.hostname.endsWith('.notify.windows.com') ||
      url.hostname === 'web.push.apple.com' ||
      url.hostname.endsWith('.push.apple.com');
    if (
      !allowed ||
      url.port ||
      url.username ||
      url.password ||
      url.hash ||
      url.protocol !== 'https:'
    ) {
      throw new BadRequestException('Unsupported push endpoint');
    }
    await this.prisma.pushSubscription.upsert({
      where: { endpoint: dto.endpoint },
      create: { userId, endpoint: dto.endpoint, ...dto.keys },
      update: { userId, ...dto.keys },
    });
    return { enabled: true };
  }

  async status(userId: string, endpoint: string) {
    const subscription = await this.prisma.pushSubscription.findFirst({
      where: { userId, endpoint },
    });
    return { enabled: Boolean(subscription) };
  }

  async unsubscribe(userId: string, endpoint: string) {
    await this.prisma.pushSubscription.deleteMany({
      where: { userId, endpoint },
    });
    return { enabled: false };
  }

  async setPresence(
    socketId: string,
    userId: string,
    workspaceId: string,
    active: boolean,
  ) {
    await this.prisma.chatPresence.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    if (!active) {
      await this.clearPresence(socketId);
      return;
    }
    const data = {
      userId,
      workspaceId,
      expiresAt: new Date(Date.now() + 45_000),
    };
    await this.prisma.chatPresence.upsert({
      where: { socketId },
      create: { socketId, ...data },
      update: data,
    });
  }

  async clearPresence(socketId: string) {
    await this.prisma.chatPresence.deleteMany({ where: { socketId } });
  }

  async notifyUser(userId: string, key: string, payload: NotificationPayload) {
    if (!this.publicKey) return;
    const subscriptions = await this.prisma.pushSubscription.findMany({
      where: { userId },
    });
    const results = await Promise.allSettled(
      subscriptions.map(async (subscription) => {
        try {
          await this.prisma.notificationAttempt.create({
            data: { subscriptionId: subscription.id, key },
          });
        } catch (error) {
          if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === 'P2002'
          )
            return;
          throw error;
        }
        try {
          await webPush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: { p256dh: subscription.p256dh, auth: subscription.auth },
            },
            JSON.stringify({ ...payload, body: payload.body.slice(0, 500) }),
            {
              TTL: 3600,
              timeout: 10_000,
              vapidDetails: {
                subject: this.config.getOrThrow<string>('VAPID_SUBJECT'),
                publicKey: this.publicKey!,
                privateKey: this.config.getOrThrow<string>('VAPID_PRIVATE_KEY'),
              },
            },
          );
        } catch (error) {
          const status = (error as { statusCode?: number }).statusCode;
          if (status === 404 || status === 410)
            await this.prisma.pushSubscription.deleteMany({
              where: { id: subscription.id },
            });
          this.logger.warn(
            `Calendar push failed (status: ${status ?? 'network'})`,
          );
        }
      }),
    );
    if (results.some((result) => result.status === 'rejected'))
      throw new Error('Unable to claim calendar push delivery');
  }

  async notifyMessage(messageId: string) {
    if (!this.publicKey) return;
    try {
      const message = await this.prisma.message.findUnique({
        where: { id: messageId },
        include: {
          sender: true,
          attachments: true,
          workspace: { include: { couple: { include: { members: true } } } },
        },
      });
      const couple = message?.workspace.couple;
      if (
        !message ||
        message.deletedAt ||
        message.type === 'SYSTEM' ||
        !couple ||
        couple.deletedAt
      )
        return;
      for (const member of couple.members) {
        if (member.userId === message.senderId) continue;
        const reading = await this.prisma.chatPresence.findFirst({
          where: {
            userId: member.userId,
            workspaceId: message.workspaceId,
            expiresAt: { gt: new Date() },
          },
        });
        if (reading) continue;
        const subscriptions = await this.prisma.pushSubscription.findMany({
          where: { userId: member.userId },
        });
        const results = await Promise.allSettled(
          subscriptions.map(async (subscription) => {
            // Atomic claim per message/device also prevents duplicates across API instances.
            try {
              await this.prisma.pushDelivery.create({
                data: { subscriptionId: subscription.id, messageId },
              });
            } catch (error) {
              if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002'
              )
                return;
              throw error;
            }
            try {
              await webPush.sendNotification(
                {
                  endpoint: subscription.endpoint,
                  keys: {
                    p256dh: subscription.p256dh,
                    auth: subscription.auth,
                  },
                },
                JSON.stringify({
                  title: message.sender.firstName,
                  body: chatPushBody(message),
                  tag: `chat:${message.id}`,
                  url: '/chat',
                }),
                {
                  TTL: 3600,
                  timeout: 10_000,
                  vapidDetails: {
                    subject: this.config.getOrThrow<string>('VAPID_SUBJECT'),
                    publicKey: this.publicKey!,
                    privateKey:
                      this.config.getOrThrow<string>('VAPID_PRIVATE_KEY'),
                  },
                },
              );
            } catch (error) {
              const status = (error as { statusCode?: number }).statusCode;
              if (status === 404 || status === 410) {
                await this.prisma.pushSubscription.deleteMany({
                  where: { id: subscription.id },
                });
              }
              // Do not retry ambiguous failures: the provider may already have accepted the push.
              this.logger.warn(
                `Chat push failed (status: ${status ?? 'network'})`,
              );
            }
          }),
        );
        if (results.some((result) => result.status === 'rejected')) {
          this.logger.error('Unable to claim or clean up a chat push delivery');
        }
      }
    } catch {
      this.logger.error('Unable to process chat push');
    }
  }
}
