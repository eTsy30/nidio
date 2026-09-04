import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, context: ExecutionContext) => {
    let request: { user?: any };

    try {
      const ctx = GqlExecutionContext.create(context);
      request = ctx.getContext().req;
    } catch {
      request = context.switchToHttp().getRequest();
    }

    const user = request.user;
    return data ? user?.[data] : user;
  },
);
