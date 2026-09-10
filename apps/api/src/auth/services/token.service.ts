import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';

import type {
  AccessTokenPayload,
  RefreshTokenPayload,
} from '../interfaces/jwt.interfaces';

@Injectable()
export class TokenService {
  constructor(private readonly jwt: JwtService) {}

  generateAccessToken(userId: string): string {
    return this.jwt.sign({ sub: userId, type: 'access' }, { expiresIn: '15m' });
  }

  createRefreshToken(userId: string) {
    const jti = randomUUID();

    return {
      jti,
      token: this.generateRefreshToken(userId, jti),
    };
  }

  generateRefreshToken(userId: string, jti: string): string {
    return this.jwt.sign(
      { sub: userId, type: 'refresh', jti },
      { expiresIn: '30d' },
    );
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    const payload = this.jwt.verify<AccessTokenPayload>(token);
    if (!payload.sub || payload.type !== 'access') {
      throw new UnauthorizedException('Invalid access token');
    }
    return payload;
  }

  verifyRefreshToken(token: string): RefreshTokenPayload {
    const payload = this.jwt.verify<RefreshTokenPayload>(token);
    if (!payload.sub || payload.type !== 'refresh' || !payload.jti) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    return payload;
  }

  decode<T extends object>(token: string): T | null {
    return this.jwt.decode(token) as T | null;
  }
}
