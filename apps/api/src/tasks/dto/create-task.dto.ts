import { Repeat } from '@prisma/client';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

import { AssigneeMode } from '../enums/assignee-mode.enum';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  columnId: string;

  @IsString()
  @IsOptional()
  assigneeId?: string;

  @IsEnum(AssigneeMode)
  @IsOptional()
  assigneeMode?: AssigneeMode;

  @IsString()
  @IsOptional()
  rotationFirstAssigneeId?: string;

  @IsDateString()
  @IsOptional()
  dueAt?: string;

  @IsEnum(Repeat)
  @IsOptional()
  repeat?: Repeat;

  @IsDateString()
  @IsOptional()
  repeatUntil?: string;

  @IsOptional()
  repeatConfig?: Record<string, unknown>;

  @IsBoolean()
  @IsOptional()
  priority?: boolean;
}
