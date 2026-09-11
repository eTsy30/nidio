import {
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

import { MessageType } from '../enums/message-type.enum';

export class CreateMessageDto {
  /** Client-generated idempotency key; distinct from the persisted message ID. */
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
