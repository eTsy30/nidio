import {
  IsIn,
  IsISO8601,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

import { currencies } from './finance.dto';

export class PageQuery {
  @IsOptional() @IsString() @MaxLength(500) cursor?: string;
}
export class BudgetQuery extends PageQuery {
  @IsIn(currencies) currency: string;
  @Matches(/^\d{4}-\d{2}-\d{2}$/) start: string;
  @Matches(/^\d{4}-\d{2}-\d{2}$/) end: string;
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/) month: string;
  @IsOptional() @IsString() @MaxLength(50) category?: string;
  @IsOptional() @IsString() @MaxLength(100) author?: string;
  @IsOptional() @IsString() @MaxLength(200) search?: string;
}
export class LimitQuery {
  @IsIn(currencies) currency: string;
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/) month: string;
}
export class PeriodQuery {
  @IsISO8601({ strict: true }) from: string;
  @IsISO8601({ strict: true }) to: string;
}
