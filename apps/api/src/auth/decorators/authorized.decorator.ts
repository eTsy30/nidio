import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

interface AuthUser {
  id: string;
  email: string;
  [key: string]: unknown;
}

export const Authorized = createParamDecorator(
  (data: keyof AuthUser, ctx: ExecutionContext): unknown => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user as AuthUser | undefined;

    if (!user) return null;

    return data ? user[data] : user;
  },
);
