import {
  Field,
  GraphQLISODateTime,
  InputType,
  PartialType,
} from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { IsDate, IsOptional } from 'class-validator';

import { CreateEventInput } from './create-event.input';

@InputType()
export class UpdateEventInput extends PartialType(CreateEventInput) {
  @Field(() => GraphQLISODateTime, { nullable: true })
  @Type(() => Date)
  @IsOptional()
  @IsDate()
  occurrenceDate?: Date;
}
