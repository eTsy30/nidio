"use client";
import { useState } from "react";

import { Button, Input } from "@/shared/ui";

import { useFinance } from "../api/FinanceProvider";
import { cardCodeError, inferCardCode } from "../model/card-code";
import { cardTones } from "../model/constants";
import type { CardInput, CardTone, LoyaltyCard } from "../model/types";

import { CardCategorySelect } from "./cards/CardCategorySelect";
import { CardScanner } from "./cards/CardScanner";
import { FinanceDialog } from "./FinanceDialog";
export function CardForm({
  card,
  onClose,
  onDelete,
}: {
  card?: LoyaltyCard;
  onClose: () => void;
  onDelete?: () => void;
}) {
  const { write, data } = useFinance();
  const [manual, setManual] = useState(Boolean(card));
  const [form, setForm] = useState<CardInput>({
    storeName: card?.storeName ?? "",
    cardNumber: card?.cardNumber ?? "",
    barcodeFormat: card?.barcodeFormat ?? "NONE",
    category: card?.category ?? "other",
    comment: card?.comment ?? "",
    color: card?.color ?? "blue",
    isFavorite: card?.isFavorite ?? false,
  });
  return (
    <>
      <FinanceDialog
        title={card ? "Изменить карту" : "Новая карта"}
        description="Название, цвет и код — карта готова."
        onClose={onClose}
        submitLabel={card ? "Сохранить" : "Добавить карту"}
        submitDisabled={!form.storeName.trim() || !form.cardNumber.trim()}
        onSubmit={async () => {
          const error = cardCodeError(form.cardNumber, form.barcodeFormat);
          if (error) throw new Error(error);
          await write(`/cards${card ? `/${card.id}` : ""}`, card ? "patch" : "post", {
            ...form,
            storeName: form.storeName.trim(),
          });
        }}
      >
        <Input
          label="Название карты"
          placeholder="Например, Евроопт"
          required
          maxLength={100}
          value={form.storeName}
          onChange={(e) => setForm({ ...form, storeName: e.target.value })}
        />
        <CardCategorySelect
          value={form.category}
          onChange={(category) => setForm({ ...form, category })}
        />
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Цвет карты</legend>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(cardTones) as CardTone[]).map((key) => {
              const tone = cardTones[key];

              return (
                <Button
                  key={key}
                  variant="secondary"
                  aria-pressed={form.color === key}
                  aria-label={tone.label}
                  className={`size-12 rounded-full border-2 bg-transparent p-2 shadow-none hover:bg-transparent ${
                    form.color === key ? "border-foreground" : "border-transparent"
                  }`}
                  onClick={() => setForm((old) => ({ ...old, color: key }))}
                >
                  <span className={`block size-6 rounded-full ${tone.bar}`} aria-hidden="true" />
                </Button>
              );
            })}
          </div>
        </fieldset>
        <CardScanner
          onManual={() => setManual(true)}
          onScan={(value) => {
            setForm((old) => ({ ...old, ...value }));
            setManual(false);
          }}
        />
        {(manual || form.cardNumber) && (
          <Input
            autoFocus
            label="Номер или содержимое кода"
            placeholder="Введите или вставьте код"
            autoComplete="off"
            maxLength={256}
            value={form.cardNumber}
            onChange={(e) => setForm({ ...form, ...inferCardCode(e.target.value) })}
          />
        )}
        {!manual && form.cardNumber && (
          <p role="status" className="text-sm text-muted-foreground">
            Код распознан. Можно сохранять карту.
          </p>
        )}
        {data.cards.some(
          (c) => c.id !== card?.id && c.cardNumber === form.cardNumber && form.cardNumber,
        ) && (
          <p className="text-sm text-warning">
            Карта с таким номером уже есть. Проверьте название магазина.
          </p>
        )}
        {onDelete && (
          <Button variant="ghost" className="text-destructive" onClick={onDelete}>
            Удалить карту
          </Button>
        )}
      </FinanceDialog>
    </>
  );
}
