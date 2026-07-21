import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class TokenService {
  constructor(private readonly jwt: JwtService) {}

  generateAccessToken(userId: string): string {
    return this.jwt.sign({
      sub: userId,
    });
  }

  generateRefreshToken(userId: string): string {
    return this.jwt.sign({
      sub: userId,
      type: 'refresh',
    });
  }

  verify<T extends object>(token: string): T {
    return this.jwt.verify<T>(token);
  }

  decode<T extends object>(token: string): T | null {
    return this.jwt.decode(token) as T | null;
  }
}
