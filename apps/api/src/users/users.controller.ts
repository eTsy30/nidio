import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { Authorization } from '../auth/decorators/Authorization.decorator';
import { Authorized } from '../auth/decorators/authorized.decorator';

import { UpdateMeDto } from './dto/update-me.dto';
import { UserMeDto } from './dto/user-me.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@Authorization()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOkResponse({ type: UserMeDto })
  getMe(@Authorized('id') userId: string) {
    return this.usersService.getMe(userId);
  }

  @Patch('me')
  @ApiOkResponse({ type: UserMeDto })
  updateMe(@Authorized('id') userId: string, @Body() dto: UpdateMeDto) {
    return this.usersService.updateMe(userId, dto);
  }
}
