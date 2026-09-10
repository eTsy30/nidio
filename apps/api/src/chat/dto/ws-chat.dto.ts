import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

import { AddReactionDto } from './add-reaction.dto';
import { EditMessageDto } from './edit-message.dto';

export class ChatPresenceDto {
  @IsBoolean()
  active!: boolean;
}

export class MessageIdDto {
  @IsString()
  @MaxLength(128)
  messageId!: string;
}

export class ChatEditDto extends MessageIdDto {
  @ValidateNested()
  @Type(() => EditMessageDto)
  dto!: EditMessageDto;
}

export class ChatReactionDto extends MessageIdDto {
  @ValidateNested()
  @Type(() => AddReactionDto)
  dto!: AddReactionDto;
}

export class ChatRemoveReactionDto extends MessageIdDto {
  @IsString()
  @MaxLength(16)
  emoji!: string;
}

export class ChatReadDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsString({ each: true })
  @MaxLength(128, { each: true })
  messageIds!: string[];
}
