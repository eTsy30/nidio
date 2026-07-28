import { ApiProperty } from '@nestjs/swagger';

export class InviteResponseDto {
  @ApiProperty({
    example: '1d4b0c52-2a6d-4d7e-9b28-5d6ef5d6f42b',
  })
  token!: string;

  @ApiProperty({
    example: 'https://nidio.app/invite/1d4b0c52-2a6d-4d7e-9b28-5d6ef5d6f42b',
  })
  url!: string;

  @ApiProperty({
    example: '2026-08-28T15:20:00.000Z',
  })
  expiresAt!: Date;
}
