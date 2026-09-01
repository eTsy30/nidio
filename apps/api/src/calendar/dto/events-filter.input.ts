import { Field, InputType } from '@nestjs/graphql';
import { GraphQLISODateTime } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsOptional } from 'class-validator';

import { EventScope } from '../models/event.model';

@InputType()
export class EventsFilterInput {
  @Field(() => EventScope)
  @IsEnum(EventScope)
  scope!: EventScope;

  @Field(() => GraphQLISODateTime, { nullable: true })
  @Type(() => Date)
  @IsOptional()
  @IsDate()
  startFrom?: Date;

  @Field(() => GraphQLISODateTime, { nullable: true })
  @Type(() => Date)
  @IsOptional()
  @IsDate()
  startTo?: Date;
}
