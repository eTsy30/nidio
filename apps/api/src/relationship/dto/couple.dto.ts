import { ApiProperty } from '@nestjs/swagger';

export class CoupleDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  partnerId!: string;

  @ApiProperty({ nullable: true })
  partnerFirstName!: string | null;

  @ApiProperty({
    nullable: true,
  })
  partnerAvatarUrl!: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty({
    nullable: true,
    description: 'Дата начала отношений',
  })
  relationshipAt!: Date | null;
}
