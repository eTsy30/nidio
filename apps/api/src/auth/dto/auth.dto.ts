import { ApiProperty } from '@nestjs/swagger';

export class AuthResponse {
  @ApiProperty({
    example: 'eyJhbGciOi...',
  })
  accessToken!: string;

  @ApiProperty({
    example: 'eyJhbGciOi...',
  })
  refreshToken!: string;
}
