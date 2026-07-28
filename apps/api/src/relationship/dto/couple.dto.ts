import { ApiProperty } from '@nestjs/swagger';

export class CoupleDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  partnerId!: string;

  @ApiProperty()
  partnerFirstName!: string;

  @ApiProperty({
    nullable: true,
  })
  partnerLastName!: string | null;

  @ApiProperty({
    nullable: true,
  })
  partnerAvatarUrl!: string | null;

  @ApiProperty()
  createdAt!: Date;
}
