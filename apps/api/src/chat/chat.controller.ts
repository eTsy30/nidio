import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { Authorization } from '../auth/decorators/Authorization.decorator';
import { Authorized } from '../auth/decorators/authorized.decorator';

import { AddReactionDto } from './dto/add-reaction.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { EditMessageDto } from './dto/edit-message.dto';
import { ChatService } from './chat.service';

@Controller('chat')
@Authorization()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('messages')
  async getMessages(
    @Authorized('id') userId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit = 20,
  ) {
    return this.chatService.getMessages(userId, cursor, Number(limit));
  }

  @Post('messages')
  async createMessage(
    @Authorized('id') userId: string,
    @Body() dto: CreateMessageDto,
  ) {
    return this.chatService.sendMessage(userId, dto);
  }

  @Patch('messages/:id')
  async editMessage(@Param('id') id: string, @Body() dto: EditMessageDto) {
    return this.chatService.editMessage(id, dto);
  }

  @Delete('messages/:id')
  async deleteMessage(@Param('id') id: string) {
    return this.chatService.deleteMessage(id);
  }

  @Post('messages/:id/reactions')
  async addReaction(
    @Authorized('id') userId: string,
    @Param('id') id: string,
    @Body() dto: AddReactionDto,
  ) {
    return this.chatService.addReaction(userId, id, dto);
  }

  /** Удаляет реакцию с сообщения. */
  @Delete('messages/:id/reactions/:emoji')
  async removeReaction(
    @Authorized('id') userId: string,
    @Param('id') id: string,
    @Param('emoji') emoji: string,
  ) {
    return this.chatService.removeReaction(userId, id, emoji);
  }
}
