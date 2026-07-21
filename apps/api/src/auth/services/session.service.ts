import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../prismas/prisma.service';

@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, tokenHash: string, expiresAt: Date) {
    return this.prisma.refreshToken.create({
      data: {
        userId,
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

  async findAllByUser(userId: string) {
    return this.prisma.refreshToken.findMany({
      where: {
        userId,
      },
    });
  }

  async findByTokenHash(tokenHash: string) {
    return this.prisma.refreshToken.findFirst({
      where: {
        tokenHash,
      },
    });
  }

  async delete(id: string) {
    return this.prisma.refreshToken.delete({
      where: {
        id,
      },
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
