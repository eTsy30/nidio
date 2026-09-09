import { Type } from 'class-transformer';
import {
  IsDefined,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class PushEndpointDto {
  @IsUrl({ protocols: ['https'], require_protocol: true })
  @MaxLength(2048)
  endpoint!: string;
}
class PushKeysDto {
  @IsString()
  @Matches(/^[A-Za-z0-9_-]{87}$/)
  p256dh!: string;

  @IsString()
  @Matches(/^[A-Za-z0-9_-]{22}$/)
  auth!: string;
}
export class SubscribePushDto extends PushEndpointDto {
  @IsDefined()
  @ValidateNested()
  @Type(() => PushKeysDto)
  keys!: PushKeysDto;
}
