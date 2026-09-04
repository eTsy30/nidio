import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { RelationshipService } from '../relationship/relationship.service';

@Injectable()
export class TemplatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly relationshipService: RelationshipService,
  ) {}

  async getAll(userId: string) {
    const couple = await this.relationshipService.getCurrentCouple(userId);

    return this.prisma.template.findMany({
      where: {
        OR: [
          { isSystem: true },
          { coupleId: couple?.id ?? '' },
          { createdById: userId },
        ],
      },
      include: { items: { orderBy: { order: 'asc' } } },
      orderBy: [{ isSystem: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async applyTemplate(templateId: string, userId: string) {
    const couple = await this.relationshipService.getCurrentCouple(userId);

    if (!couple) {
      throw new ForbiddenException('User is not in a couple');
    }

    const board = await this.prisma.board.findUnique({
      where: {
        coupleId: couple.id,
      },
    });

    if (!board) {
      throw new NotFoundException('Board not found');
    }

    const template = await this.prisma.template.findFirst({
      where: {
        id: templateId,
        OR: [
          { isSystem: true },
          { coupleId: couple.id },
          { createdById: userId },
        ],
      },
      include: {
        items: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    const maxColumnOrder = await this.prisma.column.aggregate({
      where: {
        boardId: board.id,
      },
      _max: {
        order: true,
      },
    });

    const columnOrder = (maxColumnOrder._max.order ?? -1) + 1;

    return this.prisma.$transaction(async (tx) => {
      const column = await tx.column.create({
        data: {
          boardId: board.id,
          title: template.title,
          icon: template.icon,
          color: template.color,
          order: columnOrder,
        },
      });

      const tasks = await Promise.all(
        template.items.map((item, index) =>
          tx.task.create({
            data: {
              title: item.title,
              columnId: column.id,
              coupleId: couple.id,
              order: index,
              assigneeMode: item.assigneeMode,
              repeat: item.repeat,
              createdById: userId,
            },
          }),
        ),
      );

      return {
        column,
        tasks,
      };
    });
  }

  async createCustomTemplate(userId: string, columnId: string, title: string) {
    const couple = await this.relationshipService.getCurrentCouple(userId);
    if (!couple) throw new ForbiddenException('User is not in a couple');

    const column = await this.prisma.column.findFirst({
      where: { id: columnId, board: { coupleId: couple.id } },
      include: { tasks: { orderBy: { order: 'asc' } } },
    });
    if (!column) throw new NotFoundException('Column not found');

    const template = await this.prisma.template.create({
      data: {
        title,
        icon: column.icon,
        color: column.color,
        coupleId: couple.id,
        createdById: userId,
        items: {
          create: column.tasks.map((task, index) => ({
            title: task.title,
            assigneeMode: task.assigneeMode,
            repeat: task.repeat,
            order: index,
          })),
        },
      },
      include: { items: true },
    });

    return template;
  }
}
