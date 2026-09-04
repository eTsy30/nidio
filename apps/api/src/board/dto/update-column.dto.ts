import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateColumnDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  title?: string;

  @IsString()
  @IsOptional()
  icon?: string;
}
