import { Repeat } from '@prisma/client';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

import { AssigneeMode } from '../enums/assignee-mode.enum';

export class UpdateTaskDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  title?: string;

  @IsString()
  @IsOptional()
  description?: string | null;

  @IsString()
  @IsOptional()
  columnId?: string;

  @IsString()
  @IsOptional()
  assigneeId?: string | null;

  @IsEnum(AssigneeMode)
  @IsOptional()
  assigneeMode?: AssigneeMode;

  @IsString()
  @IsOptional()
  rotationFirstAssigneeId?: string | null;

  @IsDateString()
  @IsOptional()
  dueAt?: string | null;

  @IsEnum(Repeat)
  @IsOptional()
  repeat?: Repeat;

  @IsDateString()
  @IsOptional()
  repeatUntil?: string | null;

  @IsOptional()
  repeatConfig?: Record<string, unknown>;

  @IsBoolean()
  @IsOptional()
  priority?: boolean;
}
