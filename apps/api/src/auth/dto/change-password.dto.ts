import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    example: 'OldPassword123!',
    description: 'Текущий пароль',
  })
  @IsString({
    message: 'Текущий пароль должен быть строкой',
  })
  @IsNotEmpty({
    message: 'Введите текущий пароль',
  })
  currentPassword: string;

  @ApiProperty({
    example: 'NewPassword123!',
    description: 'Новый пароль',
  })
  @IsString({
    message: 'Новый пароль должен быть строкой',
  })
  @IsNotEmpty({
    message: 'Введите новый пароль',
  })
  @MinLength(8, {
    message: 'Новый пароль должен содержать минимум 8 символов',
  })
  newPassword: string;
}
