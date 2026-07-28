import { Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { Authorization } from '../auth/decorators/Authorization.decorator';
import { Authorized } from '../auth/decorators/authorized.decorator';

import { RelationshipService } from './relationship.service';

@ApiTags('Relationship')
@Controller('relationship')
export class RelationshipController {
  constructor(private readonly relationshipService: RelationshipService) {}

  @Authorization()
  @Post('invite')
  createInvite(@Authorized('id') userId: string) {
    return this.relationshipService.createInvite(userId);
  }

  @Authorization()
  @Get('invite')
  getCurrentInvite(@Authorized('id') userId: string) {
    return this.relationshipService.getCurrentInvite(userId);
  }

  @Get('invite/:token')
  getInvite(@Param('token') token: string) {
    return this.relationshipService.getInvite(token);
  }

  @Authorization()
  @Post('invite/:token/accept')
  acceptInvite(
    @Authorized('id') userId: string,
    @Param('token') token: string,
  ) {
    return this.relationshipService.acceptInvite(userId, token);
  }

  @Authorization()
  @Get('couple')
  getCurrentCouple(@Authorized('id') userId: string) {
    return this.relationshipService.getCurrentCouple(userId);
  }

  @Authorization()
  @Delete('couple')
  leaveCouple(@Authorized('id') userId: string) {
    return this.relationshipService.leaveCouple(userId);
  }
}
