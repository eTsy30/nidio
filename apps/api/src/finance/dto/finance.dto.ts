import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
export const currencies = ['BYN', 'EUR', 'USD', 'RUB'];
export const colors = ['primary', 'success', 'warning', 'accent'];
export const expenses = [
  'groceries',
  'cafes',
  'transport',
  'housing',
  'shopping',
  'entertainment',
  'health',
  'subscriptions',
  'gifts',
  'other',
];
export const incomes = ['salary', 'freelance', 'gifts', 'refund', 'other'];
export class MoneyDto {
  @IsInt() @Min(1) @Max(2000000000) amountMinor: number;
}
export class GoalDto {
  @IsString() @MaxLength(100) @Matches(/\S/) title: string;
  @IsString() @MaxLength(2000) description: string;
  @IsInt() @Min(1) @Max(2000000000) targetMinor: number;
  @IsIn(currencies) currency: string;
  @IsIn(['🎯', '🏖️', '🏠', '🎁', '🚲', '🚗', '✨', '💍']) icon: string;
  @IsIn(colors) color: string;
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) targetDate?: string | null;
}
export class SavingsEntryDto extends MoneyDto {
  @IsUUID() requestId: string;
  @IsIn(['DEPOSIT', 'WITHDRAWAL']) type: string;
  @IsString() @MaxLength(1000) description: string;
}
export class CardDto {
  @IsString() @MaxLength(100) @Matches(/\S/) storeName: string;
  @IsString() @MaxLength(256) @Matches(/\S/) cardNumber: string;
  @IsIn(['NONE', 'QR', 'EAN13']) barcodeFormat: string;
  @IsIn(['groceries', 'clothes', 'home', 'entertainment', 'pharmacy', 'other'])
  category: string;
  @IsString() @MaxLength(1000) comment: string;
  @IsIn(colors) color: string;
  @IsBoolean() isFavorite: boolean;
}
export class FinancialEntryDto extends MoneyDto {
  @IsUUID() requestId: string;
  @IsIn(currencies) currency: string;
  @IsIn(['INCOME', 'EXPENSE']) type: string;
  @IsString() @MaxLength(30) category: string;
  @Matches(/^\d{4}-\d{2}-\d{2}$/) date: string;
  @IsString() @MaxLength(2000) description: string;
}
export class BudgetDto extends MoneyDto {
  @IsIn(currencies) currency: string;
  @IsIn(['ALL', ...expenses]) category: string;
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/) month: string;
}

export class FavoriteDto {
  @IsBoolean() isFavorite: boolean;
}
