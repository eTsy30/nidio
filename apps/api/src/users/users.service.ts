import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

import { UpdateMeDto } from './dto/update-me.dto';

const USER_ME_SELECT = {
  id: true,
  email: true,
  firstName: true,
  avatarUrl: true,
  gender: true,
  createdAt: true,
  emailVerifiedAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: USER_ME_SELECT,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateMe(userId: string, dto: UpdateMeDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.firstName !== undefined && {
          firstName: dto.firstName,
        }),
        ...(dto.avatarUrl !== undefined && {
          avatarUrl: dto.avatarUrl,
        }),
        ...(dto.gender !== undefined && {
          gender: dto.gender,
        }),
      },
      select: USER_ME_SELECT,
    });

    return user;
  }
}
