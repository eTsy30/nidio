import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserMeDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiPropertyOptional({ nullable: true })
  firstName!: string | null;

  @ApiPropertyOptional({ nullable: true })
  avatarUrl!: string | null;

  @ApiProperty({ enum: ['MALE', 'FEMALE', 'UNSPECIFIED'] })
  gender!: 'MALE' | 'FEMALE' | 'UNSPECIFIED';

  @ApiPropertyOptional({ nullable: true })
  emailVerifiedAt!: Date | null;

  @ApiProperty()
  createdAt!: Date;
}
