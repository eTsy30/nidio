import JsBarcode from "jsbarcode";

export function normalizeCardNumber(value: string, format: string) {
  return format === "EAN13" || format === "EAN8" ? value.replace(/\s/g, "") : value;
}

export function barcodeBits(value: string, format: string): string | null {
  if (!["EAN13", "EAN8", "CODE128"].includes(format)) return null;
  if (format === "EAN13" && !/^\d{13}$/.test(value)) return null;
  if (format === "EAN8" && !/^\d{8}$/.test(value)) return null;
  if (format === "CODE128" && !/^[\x20-\x7e]{1,80}$/.test(value)) return null;
  try {
    const target: { encodings?: { data: string }[] } = {};
    JsBarcode(target, value, { format, displayValue: false, flat: true });
    return target.encodings?.map((part) => part.data).join("") ?? null;
  } catch {
    return null;
  }
}

export function cardCodeError(value: string, format: string): string | null {
  if (!value.trim()) return "Введите номер карты или содержимое кода";
  if (["NONE", "QR"].includes(format)) return null;
  if (barcodeBits(value, format)) return null;
  return format === "CODE128"
    ? "Code 128: от 1 до 80 латинских букв, цифр или печатных символов"
    : `${format === "EAN8" ? "EAN-8: 8" : "EAN-13: 13"} цифр с корректной контрольной суммой`;
}

// A typed number cannot reveal the original symbology. Prefer a valid EAN,
// otherwise use Code128 for short printable identifiers and QR for other data.
export function inferCardCode(value: string) {
  const digits = value.replace(/\s/g, "");
  if (barcodeBits(digits, "EAN13")) return { cardNumber: digits, barcodeFormat: "EAN13" as const };
  if (barcodeBits(digits, "EAN8")) return { cardNumber: digits, barcodeFormat: "EAN8" as const };
  const format = !/^https?:\/\//i.test(value) && barcodeBits(value, "CODE128") ? "CODE128" : "QR";
  return { cardNumber: value, barcodeFormat: format as "CODE128" | "QR" };
}
