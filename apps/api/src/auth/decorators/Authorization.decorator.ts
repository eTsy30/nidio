import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';

import { JwtGuards } from '../guards/auth.guard';
export function Authorization() {
  return applyDecorators(UseGuards(JwtGuards), ApiBearerAuth());
}
