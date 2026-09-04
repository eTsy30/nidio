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

  async applyTemplate(templateId: string, columnId: string, userId: string) {
    const couple = await this.relationshipService.getCurrentCouple(userId);
    if (!couple) throw new ForbiddenException('User is not in a couple');

    const column = await this.prisma.column.findFirst({
      where: { id: columnId, board: { coupleId: couple.id } },
    });
    if (!column) throw new NotFoundException('Column not found');

    const template = await this.prisma.template.findUnique({
      where: { id: templateId },
      include: { items: { orderBy: { order: 'asc' } } },
    });
    if (!template) throw new NotFoundException('Template not found');

    const maxOrder = await this.prisma.task.aggregate({
      where: { columnId },
      _max: { order: true },
    });

    let currentOrder = (maxOrder._max.order ?? -1) + 1;

    const tasks = await this.prisma.$transaction(
      template.items.map((item) =>
        this.prisma.task.create({
          data: {
            title: item.title,
            columnId,
            coupleId: couple.id,
            order: currentOrder++,
            assigneeMode: item.assigneeMode,
            repeat: item.repeat,
            createdById: userId,
          },
        }),
      ),
    );

    return tasks;
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
