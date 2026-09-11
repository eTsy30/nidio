import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { RelationshipService } from '../relationship/relationship.service';

import { CreateColumnDto } from './dto/create-column.dto';
import { ReorderColumnsDto } from './dto/reorder-columns.dto';
import { UpdateColumnDto } from './dto/update-column.dto';

@Injectable()
export class BoardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly relationshipService: RelationshipService,
  ) {}

  async getBoard(userId: string) {
    const couple = await this.relationshipService.getCurrentCouple(userId);
    if (!couple) throw new ForbiddenException('User is not in a couple');

    let board = await this.prisma.board.findUnique({
      where: { coupleId: couple.id },
      include: {
        columns: {
          orderBy: { order: 'asc' },
          include: {
            tasks: {
              orderBy: [{ priority: 'desc' }, { order: 'asc' }],
              include: { completions: { select: { userId: true } } },
            },
          },
        },
      },
    });

    if (!board) {
      board = await this.prisma.board.create({
        data: { coupleId: couple.id },
        include: {
          columns: {
            orderBy: { order: 'asc' },
            include: {
              tasks: {
                orderBy: [{ priority: 'desc' }, { order: 'asc' }],
                include: { completions: { select: { userId: true } } },
              },
            },
          },
        },
      });
    }

    return board;
  }

  async createColumn(userId: string, dto: CreateColumnDto) {
    const couple = await this.relationshipService.getCurrentCouple(userId);
    if (!couple) throw new ForbiddenException('User is not in a couple');

    const board = await this.prisma.board.findUnique({
      where: { coupleId: couple.id },
    });
    if (!board) throw new NotFoundException('Board not found');

    const maxOrder = await this.prisma.column.aggregate({
      where: { boardId: board.id },
      _max: { order: true },
    });

    const colors = [
      '#F5F5F5',
      '#E8F5E9',
      '#FFF3E0',
      '#E3F2FD',
      '#F3E5F5',
      '#ECEFF1',
      '#FFEBEE',
    ];
    const count = await this.prisma.column.count({
      where: { boardId: board.id },
    });

    return this.prisma.column.create({
      data: {
        boardId: board.id,
        title: dto.title,
        icon: dto.icon ?? null,
        color: colors[count % colors.length] ?? null,
        order: (maxOrder._max.order ?? -1) + 1,
      },
      include: { tasks: true },
    });
  }

  async updateColumn(userId: string, columnId: string, dto: UpdateColumnDto) {
    const couple = await this.relationshipService.getCurrentCouple(userId);
    if (!couple) throw new ForbiddenException('User is not in a couple');

    const column = await this.prisma.column.findFirst({
      where: { id: columnId, board: { coupleId: couple.id } },
    });
    if (!column) throw new NotFoundException('Column not found');

    return this.prisma.column.update({
      where: { id: columnId },
      data: dto,
      include: { tasks: true },
    });
  }

  async deleteColumn(userId: string, columnId: string) {
    const couple = await this.relationshipService.getCurrentCouple(userId);
    if (!couple) throw new ForbiddenException('User is not in a couple');

    const column = await this.prisma.column.findFirst({
      where: { id: columnId, board: { coupleId: couple.id } },
    });
    if (!column) throw new NotFoundException('Column not found');

    await this.prisma.column.delete({ where: { id: columnId } });
    return { success: true };
  }

  async reorderColumns(userId: string, dto: ReorderColumnsDto) {
    const couple = await this.relationshipService.getCurrentCouple(userId);
    if (!couple) throw new ForbiddenException('User is not in a couple');

    await this.prisma.$transaction(
      dto.columnIds.map((id, index) =>
        this.prisma.column.updateMany({
          where: { id, board: { coupleId: couple.id } },
          data: { order: index },
        }),
      ),
    );

    return { success: true };
  }
}
