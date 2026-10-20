/// <reference types="jest" />
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import {
  BudgetDto,
  FinancialEntryDto,
  GoalDto,
  MoneyDto,
} from './dto/finance.dto';
import { savingsBalance, validDate, validEan13 } from './finance-rules';

describe('finance validation and accounting', () => {
  it('adds and subtracts integer minor units without rounding errors', () => {
    expect(
      savingsBalance([
        { amountMinor: 10, type: 'DEPOSIT' },
        { amountMinor: 20, type: 'DEPOSIT' },
        { amountMinor: 15, type: 'WITHDRAWAL' },
      ]),
    ).toBe(15);
    expect(savingsBalance([])).toBe(0);
  });
  it('rejects impossible calendar dates and accepts leap days', () => {
    expect(() => validDate('2024-02-29')).not.toThrow();
    for (const date of ['2026-02-29', '2026-04-31', '2026-13-01', 'invalid'])
      expect(() => validDate(date)).toThrow();
  });
  it('validates EAN-13 check digits and preserves leading zeroes', () => {
    expect(validEan13('4006381333931')).toBe(true);
    expect(validEan13('0036000291452')).toBe(true);
    for (const value of ['4006381333932', '123', 'abcdefghijklm'])
      expect(validEan13(value)).toBe(false);
  });
  it('rejects zero, negative, fractional and unsafe amounts at the API boundary', async () => {
    for (const amountMinor of [
      0,
      -1,
      0.1,
      2000000001,
      Number.MAX_SAFE_INTEGER,
      '100',
    ]) {
      expect(
        (await validate(plainToInstance(MoneyDto, { amountMinor }))).length,
      ).toBeGreaterThan(0);
    }
    expect(
      await validate(plainToInstance(MoneyDto, { amountMinor: 12345 })),
    ).toHaveLength(0);
  });
  it('rejects unsupported currency, color, malformed month and request identifiers', async () => {
    expect(
      (
        await validate(
          plainToInstance(GoalDto, {
            title: '   ',
            currency: 'BTC',
            color: '#fff',
            targetMinor: 0,
          }),
        )
      ).length,
    ).toBeGreaterThan(0);
    expect(
      (
        await validate(
          plainToInstance(BudgetDto, {
            month: '2026-13',
            currency: 'EUR',
            category: 'ALL',
            amountMinor: 10,
          }),
        )
      ).length,
    ).toBeGreaterThan(0);
    expect(
      (
        await validate(
          plainToInstance(FinancialEntryDto, { requestId: 'not-a-uuid' }),
        )
      ).length,
    ).toBeGreaterThan(0);
  });
});
