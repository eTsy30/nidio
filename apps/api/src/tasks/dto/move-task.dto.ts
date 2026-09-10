import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsString, Max, Min } from 'class-validator';

export class MoveTaskDto {
  @IsString()
  columnId!: string;

  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  order!: number;
}
