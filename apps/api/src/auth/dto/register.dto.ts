import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterRequestDto {
  @ApiProperty({
    example: 'Евгений',
  })
  @IsString({ message: 'Имя должно быть строкой' })
  @IsNotEmpty({ message: 'Имя обязательно' })
  @MinLength(2, { message: 'Минимум 2 символа' })
  @MaxLength(50, { message: 'Максимум 50 символов' })
  firstName!: string;

  @ApiProperty({
    example: 'user@mail.com',
  })
  @IsEmail({}, { message: 'Некорректный email' })
  email!: string;

  @ApiProperty({
    example: 'StrongPassword123',
  })
  @IsString({ message: 'Пароль должен быть строкой' })
  @MinLength(6, { message: 'Минимум 6 символов' })
  @MaxLength(120, { message: 'Максимум 120 символов' })
  password!: string;

  @ApiProperty({
    example: 'StrongPassword123',
  })
  @IsString({ message: 'Подтверждение пароля должно быть строкой' })
  @MinLength(6, { message: 'Минимум 6 символов' })
  @MaxLength(120, { message: 'Максимум 120 символов' })
  confirmPassword!: string;
}
