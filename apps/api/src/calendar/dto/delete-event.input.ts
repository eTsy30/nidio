import { Field, GraphQLISODateTime, ID, InputType } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsOptional, IsString } from 'class-validator';

import { EventDeleteMode } from '../models/event-delete-mode';

@InputType()
export class DeleteEventInput {
  @Field(() => ID)
  @IsString()
  id!: string;

  @Field(() => EventDeleteMode, {
    defaultValue: EventDeleteMode.ALL,
  })
  @IsEnum(EventDeleteMode)
  mode!: EventDeleteMode;

  @Field(() => GraphQLISODateTime, {
    nullable: true,
  })
  @Type(() => Date)
  @IsOptional()
  @IsDate()
  occurrenceDate?: Date;
}
