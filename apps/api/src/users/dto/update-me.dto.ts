import { ApiPropertyOptional } from '@nestjs/swagger';
import { Gender } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateMeDto {
  @ApiPropertyOptional({
    example: 'Евгений',
    description: 'Имя пользователя',
  })
  @IsOptional()
  @IsString({ message: 'Имя должно быть строкой' })
  @MaxLength(50, { message: 'Максимум 50 символов' })
  firstName?: string;

  @ApiPropertyOptional({
    example: 'http://localhost:9000/nidio/users/user-id/images/avatar.png',
    nullable: true,
    description: 'URL аватара',
  })
  @IsOptional()
  @IsString({ message: 'URL аватара должен быть строкой' })
  avatarUrl?: string | null;

  @ApiPropertyOptional({
    enum: Gender,
    example: Gender.MALE,
  })
  @IsOptional()
  @IsEnum(Gender, {
    message: 'Некорректный пол',
  })
  gender?: Gender;
}
