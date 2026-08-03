import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Invite, InviteStatus, Prisma, WorkspaceType } from '@prisma/client';
import { randomUUID } from 'node:crypto';

import { PrismaService } from '../prisma/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';

@Injectable()
export class RelationshipService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly realtimeService: RealtimeService,
  ) {}

  async createInvite(userId: string) {
    await this.ensureUserHasNoCouple(userId);

    await this.prisma.invite.updateMany({
      where: {
        creatorId: userId,
        status: InviteStatus.PENDING,
      },
      data: {
        status: InviteStatus.REVOKED,
        revokedAt: new Date(),
      },
    });

    const token = this.generateInviteToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const invite = await this.prisma.invite.create({
      data: {
        creatorId: userId,
        token,
        expiresAt,
        status: InviteStatus.PENDING,
      },
    });

    return {
      token: invite.token,
      url: this.buildInviteUrl(invite.token),
      expiresAt: invite.expiresAt,
    };
  }

  async getCurrentInvite(userId: string) {
    const invite = await this.prisma.invite.findFirst({
      where: {
        creatorId: userId,
        status: InviteStatus.PENDING,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!invite) {
      return null;
    }

    return {
      token: invite.token,
      url: this.buildInviteUrl(invite.token),
      expiresAt: invite.expiresAt,
    };
  }

  async getInvite(token: string) {
    const invite = await this.ensureInviteIsValid(token);

    return {
      valid: true,
      senderFirstName: invite.creator.firstName,
      senderAvatarUrl: invite.creator.avatarUrl,
      expiresAt: invite.expiresAt,
    };
  }
  async acceptInvite(userId: string, token: string) {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const invite = await this.ensureInviteIsValid(token);

      if (invite.creatorId === userId) {
        throw new BadRequestException('You cannot accept your own invitation.');
      }

      const creatorMembership = await tx.coupleMember.findFirst({
        where: { userId: invite.creatorId },
      });
      if (creatorMembership) {
        throw new ConflictException('Invitation owner is already in a couple.');
      }

      const receiverMembership = await tx.coupleMember.findFirst({
        where: { userId },
      });
      if (receiverMembership) {
        throw new ConflictException('User is already in a couple.');
      }

      const couple = await this.createCouple(tx, invite, userId);

      this.realtimeService.emitToUser(
        invite.creatorId,
        'relationship.connected',
        {
          type: 'relationship.connected',
          relationshipId: couple.id,
          partnerId: userId,
        },
      );

      this.realtimeService.emitToUser(userId, 'relationship.connected', {
        type: 'relationship.connected',
        relationshipId: couple.id,
        partnerId: invite.creatorId,
      });

      return couple;
    });
  }

  async leaveCouple(userId: string) {
    const membership = await this.prisma.coupleMember.findFirst({
      where: {
        userId,
      },
    });

    if (!membership) {
      throw new NotFoundException('Couple not found.');
    }

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const coupleId = membership.coupleId;

      await tx.coupleMember.deleteMany({
        where: {
          coupleId,
        },
      });

      await tx.workspace.updateMany({
        where: {
          coupleId,
        },
        data: {
          coupleId: null,
        },
      });

      await tx.invite.updateMany({
        where: {
          coupleId,
          status: InviteStatus.PENDING,
        },
        data: {
          status: InviteStatus.REVOKED,
          revokedAt: new Date(),
        },
      });

      await tx.couple.update({
        where: {
          id: coupleId,
        },
        data: {
          deletedAt: new Date(),
        },
      });

      return { success: true };
    });
  }

  async getCurrentCouple(userId: string) {
    const membership = await this.prisma.coupleMember.findFirst({
      where: {
        userId,
      },
      include: {
        couple: {
          include: {
            members: {
              include: {
                user: true,
              },
            },
            workspace: true,
          },
        },
      },
    });

    if (!membership) return null;

    if (!membership.couple || membership.couple.deletedAt) {
      return null;
    }
    if (!membership.couple.workspace) {
      throw new NotFoundException('Workspace not found.');
    }

    const partner = membership.couple.members.find(
      (member) => member.userId !== userId,
    );

    if (!partner) {
      throw new NotFoundException('Partner not found.');
    }

    return {
      id: membership.couple.id,
      workspaceId: membership.couple.workspace.id,
      partnerId: partner.user.id,
      partnerFirstName: partner.user.firstName,
      partnerAvatarUrl: partner.user.avatarUrl,
      createdAt: membership.couple.createdAt,
    };
  }

  async getWorkspaceId(userId: string): Promise<string> {
    const workspace = await this.prisma.workspace.findFirst({
      where: {
        OR: [
          {
            type: WorkspaceType.PERSONAL,
            userId,
          },
          {
            type: WorkspaceType.COUPLE,
            couple: {
              members: {
                some: {
                  userId,
                },
              },
            },
          },
        ],
      },
      select: {
        id: true,
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found.');
    }

    return workspace.id;
  }

  // private хелпер потом вынести

  private async ensureUserHasNoCouple(userId: string) {
    const membership = await this.prisma.coupleMember.findUnique({
      where: {
        userId,
      },
      include: { couple: true },
    });

    if (membership && !membership.couple?.deletedAt) {
      throw new ConflictException('User is already in a couple.');
    }
  }

  private async ensureInviteIsValid(token: string) {
    const invite = await this.prisma.invite.findUnique({
      where: {
        token,
      },
      include: {
        creator: true,
      },
    });

    if (!invite) {
      throw new NotFoundException('Invitation not found.');
    }

    if (invite.status !== InviteStatus.PENDING) {
      throw new BadRequestException('Invitation is no longer available.');
    }

    if (invite.expiresAt < new Date()) {
      await this.prisma.invite.update({
        where: {
          id: invite.id,
        },
        data: {
          status: InviteStatus.EXPIRED,
        },
      });

      throw new BadRequestException('Invitation has expired.');
    }

    return invite;
  }

  private async createCouple(
    tx: Prisma.TransactionClient,
    invite: Invite,
    receiverId: string,
  ) {
    const couple = await tx.couple.create({
      data: {},
    });

    await tx.coupleMember.createMany({
      data: [
        {
          coupleId: couple.id,
          userId: invite.creatorId,
        },
        {
          coupleId: couple.id,
          userId: receiverId,
        },
      ],
    });

    await tx.workspace.create({
      data: {
        coupleId: couple.id,
        type: WorkspaceType.COUPLE,
        title: 'Our Space',
      },
    });

    await tx.invite.update({
      where: {
        id: invite.id,
      },
      data: {
        status: InviteStatus.ACCEPTED,
        acceptedAt: new Date(),
        coupleId: couple.id,
      },
    });

    await tx.invite.updateMany({
      where: {
        creatorId: invite.creatorId,
        status: InviteStatus.PENDING,
        id: {
          not: invite.id,
        },
      },
      data: {
        status: InviteStatus.REVOKED,
        revokedAt: new Date(),
      },
    });

    return couple;
  }

  private buildInviteUrl(token: string): string {
    const frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL');
    return `${frontendUrl}/invite/${token}`;
  }

  private generateInviteToken() {
    return randomUUID();
  }
}
