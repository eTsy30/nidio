import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class UpdateRelationshipDto {
  @ApiPropertyOptional({
    example: '2024-02-14T00:00:00.000Z',
    nullable: true,
    description: 'Дата начала отношений',
  })
  @IsOptional()
  @IsDateString(
    {},
    {
      message: 'Некорректная дата начала отношений',
    },
  )
  relationshipAt?: string | null;
}
