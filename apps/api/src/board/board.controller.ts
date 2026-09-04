import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtGuards } from '../auth/guards/auth.guard';

import { CreateColumnDto } from './dto/create-column.dto';
import { ReorderColumnsDto } from './dto/reorder-columns.dto';
import { UpdateColumnDto } from './dto/update-column.dto';
import { BoardService } from './board.service';

@Controller('boards')
@UseGuards(JwtGuards)
export class BoardController {
  constructor(private readonly boardService: BoardService) {}

  @Get()
  getBoard(@CurrentUser('id') userId: string) {
    return this.boardService.getBoard(userId);
  }

  @Post('columns')
  createColumn(
    @Body() dto: CreateColumnDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.boardService.createColumn(userId, dto);
  }

  @Patch('columns/:id')
  updateColumn(
    @Param('id') id: string,
    @Body() dto: UpdateColumnDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.boardService.updateColumn(userId, id, dto);
  }

  @Delete('columns/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteColumn(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    await this.boardService.deleteColumn(userId, id);
  }

  @Patch('columns/reorder')
  reorderColumns(
    @Body() dto: ReorderColumnsDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.boardService.reorderColumns(userId, dto);
  }
}
