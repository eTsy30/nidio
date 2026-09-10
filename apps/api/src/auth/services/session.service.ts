import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    jti: string,
    tokenHash: string,
    expiresAt: Date,
  ) {
    return this.prisma.refreshToken.create({
      data: {
        userId,
        jti,
        tokenHash,
        expiresAt,
      },
    });
  }

  async findById(id: string) {
    return this.prisma.refreshToken.findUnique({
      where: {
        id,
      },
    });
  }

  async findByJti(jti: string, userId: string) {
    return this.prisma.refreshToken.findFirst({
      where: { jti, userId },
    });
  }

  async delete(id: string) {
    return this.prisma.refreshToken.delete({
      where: {
        id,
      },
    });
  }

  async rotate(
    session: { id: string; userId: string; jti: string; tokenHash: string },
    next: { jti: string; tokenHash: string; expiresAt: Date },
  ) {
    return this.prisma.$transaction(async (tx) => {
      const consumed = await tx.refreshToken.deleteMany({
        where: {
          id: session.id,
          userId: session.userId,
          jti: session.jti,
          tokenHash: session.tokenHash,
          expiresAt: { gt: new Date() },
        },
      });

      if (consumed.count !== 1) {
        return false;
      }

      await tx.refreshToken.create({
        data: { userId: session.userId, ...next },
      });
      return true;
    });
  }

  async deleteByUser(userId: string) {
    return this.prisma.refreshToken.deleteMany({
      where: {
        userId,
      },
    });
  }

  async cleanupExpired() {
    return this.prisma.refreshToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }
}
