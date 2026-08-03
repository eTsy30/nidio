import {
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

import { MessageType } from '../enums/message-type.enum';

export class CreateMessageDto {
  /**
   * Временный идентификатор сообщения, который генерирует клиент.
   * Используется для optimistic UI и сопоставления ответа сервера.
   * !!!!!! ВАЖНО
   *  clientId никогда не сохраняется как основной идентификатор сообщения.
   *  Он нужен только для сопоставления временного сообщения на клиенте с сообщением, созданным сервером.
   */
  @IsString()
  @MaxLength(100)
  clientId!: string;

  @IsEnum(MessageType)
  type!: MessageType;

  @IsOptional()
  @IsString()
  @Matches(/\S/, {
    message: 'Message cannot be empty.',
  })
  @MaxLength(5000)
  content?: string;

  @IsOptional()
  @IsString()
  replyToId?: string;
}
