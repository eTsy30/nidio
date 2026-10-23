import { cardNumber, validCardCode } from './card-rules';

describe('loyalty card codes', () => {
  it('validates both EAN checksums and preserves leading zeroes', () => {
    expect(validCardCode('4006381333931', 'EAN13')).toBe(true);
    expect(validCardCode('96385074', 'EAN8')).toBe(true);
    expect(validCardCode('00000000', 'EAN8')).toBe(true);
    expect(validCardCode('96385075', 'EAN8')).toBe(false);
    expect(validCardCode('4006381333932', 'EAN13')).toBe(false);
    expect(validCardCode('123', 'EAN13')).toBe(false);
  });
  it('preserves QR and Code128 content without guessing formats', () => {
    expect(cardNumber(' 0012 3456 ', 'EAN8')).toBe('00123456');
    expect(cardNumber(' A B ', 'QR')).toBe(' A B ');
    expect(validCardCode(' A B ', 'CODE128')).toBe(true);
    expect(validCardCode('Русский QR', 'QR')).toBe(true);
    expect(validCardCode('Русский', 'CODE128')).toBe(false);
    expect(validCardCode('x'.repeat(81), 'CODE128')).toBe(false);
    expect(validCardCode('\n', 'CODE128')).toBe(false);
    expect(validCardCode('value', 'FAKE')).toBe(false);
    expect(validCardCode(' ', 'NONE')).toBe(false);
  });
});
