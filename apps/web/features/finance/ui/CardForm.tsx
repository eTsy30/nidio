"use client";
import { useState } from "react";

import { Checkbox, Input, InputControl, Select, Textarea } from "@/shared/ui";

import { useFinance } from "../api/FinanceProvider";
import { ean13Bits } from "../model/barcode";
import { cardCategories } from "../model/constants";
import type { CardInput, LoyaltyCard } from "../model/types";

import { FinanceDialog } from "./FinanceDialog";
import { ToneField } from "./FinanceFields";
export function CardForm({ card, onClose }: { card?: LoyaltyCard; onClose: () => void }) {
  const { write } = useFinance();
  const [savedId, setSavedId] = useState(card?.id);
  const [form, setForm] = useState<CardInput>({
    storeName: card?.storeName ?? "",
    cardNumber: card?.cardNumber ?? "",
    barcodeFormat: card?.barcodeFormat ?? "NONE",
    category: card?.category ?? "groceries",
    comment: card?.comment ?? "",
    color: card?.color ?? "primary",
    isFavorite: card?.isFavorite ?? false,
  });
  const [file, setFile] = useState<File | null>(null);
  const change = <K extends keyof CardInput>(key: K, value: CardInput[K]) =>
    setForm((old) => ({ ...old, [key]: value }));
  return (
    <FinanceDialog
      title={card ? "Изменить карту" : "Добавить карту"}
      onClose={onClose}
      onSubmit={async () => {
        if (form.barcodeFormat === "EAN13" && !ean13Bits(form.cardNumber))
          throw new Error("Проверьте 13 цифр и контрольную сумму EAN-13");
        if (
          file &&
          (file.size > 5 * 1024 * 1024 ||
            !["image/jpeg", "image/png", "image/webp"].includes(file.type))
        )
          throw new Error("Выберите JPG, PNG или WebP до 5 МБ");
        const result = (await write(
          `/cards${savedId ? `/${savedId}` : ""}`,
          savedId ? "patch" : "post",
          { ...form, storeName: form.storeName.trim() },
        )) as LoyaltyCard;
        setSavedId(result.id);
        if (file) {
          const body = new FormData();
          body.set("file", file);
          await write(`/cards/${result.id}/image`, "post", body);
        }
      }}
    >
      <Input
        label="Магазин"
        required
        maxLength={100}
        value={form.storeName}
        onChange={(e) => change("storeName", e.target.value)}
      />
      <Input
        label="Номер карты или содержимое кода"
        required
        maxLength={256}
        value={form.cardNumber}
        onChange={(e) => change("cardNumber", e.target.value)}
      />
      <Select
        label="Формат оригинального кода"
        value={form.barcodeFormat}
        onChange={(e) => change("barcodeFormat", e.target.value as CardInput["barcodeFormat"])}
      >
        <option value="NONE">Не знаю — только номер</option>
        <option value="EAN13">EAN-13 · 13 цифр</option>
        <option value="QR">QR-код</option>
      </Select>
      <p className="text-xs text-muted-foreground">
        Выберите формат, указанный на вашей карте. Неизвестный код не преобразуется автоматически.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Категория"
          value={form.category}
          onChange={(e) => change("category", e.target.value)}
        >
          {Object.entries(cardCategories).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </Select>
        <ToneField value={form.color} onChange={(value) => change("color", value)} />
      </div>
      <label className="block space-y-2 text-sm font-semibold">
        Фото карты · до 5 МБ
        <InputControl
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </label>
      {savedId && !card && (
        <p role="status" className="text-sm text-muted-foreground">
          Карта сохранена. Если фото не загрузилось, повторите сохранение или закройте окно.
        </p>
      )}
      <label className="block space-y-2 text-sm font-semibold">
        Комментарий
        <Textarea
          value={form.comment}
          maxLength={1000}
          onChange={(e) => change("comment", e.target.value)}
        />
      </label>
      <Checkbox checked={form.isFavorite} onCheckedChange={(value) => change("isFavorite", value)}>
        В избранное
      </Checkbox>
    </FinanceDialog>
  );
}
