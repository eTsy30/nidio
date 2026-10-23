import { distributeSavings, validatePlan } from './savings-plan';
describe('Savings plan', () => {
  it.each([1, 30, 120])('preserves minor units for %i stages', (count) => {
    for (const varied of [false, true]) {
      const amounts = distributeSavings(1500001, count, varied);
      expect(amounts).toHaveLength(count);
      expect(amounts.reduce((a, b) => a + b, 0)).toBe(1500001);
      expect(amounts.every((n) => Number.isInteger(n) && n > 0)).toBe(true);
    }
  });
  it('rejects impossible plans', () => {
    expect(() => distributeSavings(2, 3)).toThrow();
    expect(() => validatePlan([100, 99], 200)).toThrow();
    expect(() => validatePlan([-1, 201], 200)).toThrow();
  });
});
