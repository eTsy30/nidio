import { ApiProperty } from '@nestjs/swagger';

export class InviteInfoDto {
  @ApiProperty()
  valid!: boolean;

  @ApiProperty({
    example: 'Евгений',
  })
  senderFirstName!: string;

  @ApiProperty({
    example: 'https://cdn.nidio.app/avatar.jpg',
    nullable: true,
  })
  senderAvatarUrl!: string | null;

  @ApiProperty({
    example: '2026-08-28T15:20:00.000Z',
  })
  expiresAt!: Date;
}
