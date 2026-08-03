import { IsOptional, IsString, MaxLength } from 'class-validator';

export class EditMessageDto {
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  content?: string;
}
