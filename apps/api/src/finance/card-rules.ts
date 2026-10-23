export function cardNumber(value: string, format: string) {
  return ['EAN13', 'EAN8'].includes(format) ? value.replace(/\s/g, '') : value;
}

export function validCardCode(value: string, format: string): boolean {
  if (!value.trim() || value.length > 256) return false;
  if (format === 'NONE' || format === 'QR') return true;
  if (format === 'CODE128') return /^[\x20-\x7e]{1,80}$/.test(value);
  const length = format === 'EAN13' ? 13 : format === 'EAN8' ? 8 : 0;
  if (!length || value.length !== length || !/^\d+$/.test(value)) return false;
  return (
    [...value]
      .reverse()
      .reduce((sum, n, i) => sum + Number(n) * (i % 2 ? 3 : 1), 0) %
      10 ===
    0
  );
}
