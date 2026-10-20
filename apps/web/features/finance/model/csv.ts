import { categoryName } from "./constants";
import type { FinancialEntry } from "./types";
function cell(value: string) {
  const safe = /^[=+@\-\t\r\n]/.test(value) ? "'" + value : value;
  return `"${safe.replaceAll('"', '""')}"`;
}
export function entriesCsv(entries: FinancialEntry[], name: (id: string) => string) {
  const rows = [
    ["Дата", "Тип", "Категория", "Сумма", "Валюта", "Описание", "Автор"],
    ...entries.map((e) => [
      e.date,
      e.type === "INCOME" ? "Доход" : "Расход",
      categoryName(e.category),
      (e.amountMinor / 100).toFixed(2),
      e.currency,
      e.description,
      name(e.createdBy),
    ]),
  ];
  return "\uFEFF" + rows.map((row) => row.map(cell).join(";")).join("\r\n");
}
export function downloadCsv(text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "nidio-operations.csv";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
