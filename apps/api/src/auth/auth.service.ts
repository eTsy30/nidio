import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UnauthorizedException } from '@nestjs/common';

import { EmailService } from '../email/email.service';
import { PrismaService } from '../prismas/prisma.service';

import { LoginDto } from './dto/login.dto';
import { RegisterRequestDto } from './dto/register.dto';
import { PasswordService } from './services/password.service';
import { SessionService } from './services/session.service';
import { TokenService } from './services/token.service';
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly sessionService: SessionService,
    private readonly emailService: EmailService,
  ) {}

  private async auth(userId: string) {
    const accessToken = this.tokenService.generateAccessToken(userId);

    const refreshToken = this.tokenService.generateRefreshToken(userId);

    const tokenHash = await this.passwordService.hash(refreshToken);

    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

    await this.sessionService.create(userId, tokenHash, expiresAt);

    return {
      accessToken,
      refreshToken,
    };
  }

  async validate(id: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async register(dto: RegisterRequestDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    if (dto.password !== dto.confirmPassword) {
      throw new ConflictException('Passwords do not match');
    }

    const passwordHash = await this.passwordService.hash(dto.password);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName ?? null,
      },
    });

    return this.auth(user.id);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isValidPassword = await this.passwordService.verify(
      user.passwordHash,

      dto.password,
    );

    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.auth(user.id);
  }

  async logout(userId: string) {
    await this.sessionService.deleteByUser(userId);
    return { success: true };
  }

  async refresh(refreshToken: string) {
    const payload = this.tokenService.verify<{ sub: string }>(refreshToken);

    const sessions = await this.sessionService.findAllByUser(payload.sub);

    const session = await (async () => {
      for (const item of sessions) {
        const ok = await this.passwordService.verify(
          item.tokenHash,
          refreshToken,
        );
        if (ok) return item;
      }
      return null;
    })();

    if (!session) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (session.expiresAt < new Date()) {
      await this.sessionService.delete(session.id);
      throw new UnauthorizedException('Refresh token expired');
    }

    await this.sessionService.delete(session.id);

    return this.auth(payload.sub);
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    // Do not reveal whether the user exists.
    if (!user) {
      return {
        message:
          'If the account exists, password reset instructions have been sent.',
      };
    }

    const resetToken = this.passwordService.generateResetToken();
    const resetTokenHash = await this.passwordService.hash(resetToken);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 15);

    await this.prisma.passwordReset.create({
      data: {
        userId: user.id,
        tokenHash: resetTokenHash,
        expiresAt,
      },
    });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    await this.emailService.sendPasswordReset(user.email, resetUrl);

    return {
      message:
        'If the account exists, password reset instructions have been sent.',
      ...(process.env.NODE_ENV === 'development' ? { resetToken } : {}),
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const resets = await this.prisma.passwordReset.findMany({
      include: {
        user: true,
      },
    });

    const reset = await (async () => {
      for (const item of resets) {
        const ok = await this.passwordService.verify(item.tokenHash, token);
        if (ok) return item;
      }
      return null;
    })();

    if (!reset) {
      throw new UnauthorizedException('Invalid reset token');
    }

    if (reset.expiresAt < new Date()) {
      await this.prisma.passwordReset.delete({
        where: { id: reset.id },
      });

      throw new UnauthorizedException('Reset token expired');
    }

    const passwordHash = await this.passwordService.hash(newPassword);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: reset.userId },
        data: {
          passwordHash,
        },
      }),
      this.prisma.passwordReset.delete({
        where: { id: reset.id },
      }),
      this.prisma.refreshToken.deleteMany({
        where: {
          userId: reset.userId,
        },
      }),
    ]);

    return {
      message: 'Password successfully changed',
    };
  }
}
