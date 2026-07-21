import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { randomUUID } from 'node:crypto';

@Injectable()
export class PasswordService {
  async hash(password: string): Promise<string> {
    return argon2.hash(password);
  }

  async verify(hash: string, password: string): Promise<boolean> {
    return argon2.verify(hash, password);
  }

  generateResetToken(): string {
    return randomUUID();
  }

  generateVerificationToken(): string {
    return randomUUID();
  }
}
