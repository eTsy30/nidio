"use client";
import { useState } from "react";
import { Plus, Search, Star } from "lucide-react";
import { toast } from "sonner";

import { Button, Card, ChoiceButton, Input, Select } from "@/shared/ui";

import { useFinance } from "../api/FinanceProvider";
import { cardCategories, categoryName, tones } from "../model/constants";

import { CardDetails } from "./CardDetails";
import { CardForm } from "./CardForm";
import { ConfirmDelete } from "./FinanceDialog";
import { FinanceEmpty } from "./FinanceEmpty";
export function CardsTab() {
  const { data, write, busy } = useFinance();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [order, setOrder] = useState("favorites");
  const [modal, setModal] = useState<{ kind: string; id?: string } | null>(null);
  const card = data.cards.find((c) => c.id === modal?.id);
  const close = () => setModal(null);
  const cards = data.cards
    .filter(
      (c) =>
        (category === "ALL" || c.category === category) &&
        `${c.storeName} ${c.cardNumber}`.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
    )
    .sort((a, b) =>
      order === "recent"
        ? (b.lastUsedAt ?? "").localeCompare(a.lastUsedAt ?? "")
        : Number(b.isFavorite) - Number(a.isFavorite) || a.storeName.localeCompare(b.storeName),
    );
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Ваши скидки всегда с вами · {data.cards.length}
        </p>
        <Button leftIcon={<Plus />} onClick={() => setModal({ kind: "create" })}>
          Добавить карту
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
        <Input
          label="Найти карту"
          leftIcon={<Search />}
          placeholder="Магазин или номер"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select label="Порядок" value={order} onChange={(e) => setOrder(e.target.value)}>
          <option value="favorites">Избранные сначала</option>
          <option value="recent">Недавно открытые</option>
        </Select>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2" aria-label="Категории карт">
        {Object.entries({ ALL: "Все", ...cardCategories }).map(([key, label]) => (
          <ChoiceButton
            key={key}
            selected={category === key}
            className="shrink-0"
            onClick={() => setCategory(key)}
          >
            {label}
          </ChoiceButton>
        ))}
      </div>
      {!cards.length ? (
        <FinanceEmpty title={data.cards.length ? "Ничего не найдено" : "Одна карта — для двоих"}>
          {data.cards.length
            ? "Измените запрос или категорию."
            : "Добавьте первую скидочную карту. Партнёр тоже сможет показать её на кассе."}
        </FinanceEmpty>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <Card padding="sm" key={c.id} className={`relative min-w-0 ${tones[c.color].surface}`}>
              <Button
                variant="plain"
                size="none"
                className="w-full space-y-5 text-left"
                onClick={() => {
                  setModal({ kind: "detail", id: c.id });
                  void write(`/cards/${c.id}/used`, "post").catch(() =>
                    toast.error("Не удалось обновить время открытия"),
                  );
                }}
              >
                <span className="block pr-12 text-xl font-semibold break-words">{c.storeName}</span>
                <span className="block text-xs text-muted-foreground">
                  {categoryName(c.category)}
                </span>
                <span className="block font-mono text-lg tracking-widest">
                  •••• {c.cardNumber.slice(-4)}
                </span>
              </Button>
              <Button
                variant="icon"
                iconOnly
                className="absolute right-2 top-2"
                aria-label={c.isFavorite ? "Убрать из избранного" : "В избранное"}
                aria-pressed={c.isFavorite}
                disabled={busy}
                onClick={() => {
                  void write(`/cards/${c.id}/favorite`, "post", {
                    isFavorite: !c.isFavorite,
                  }).catch(() => toast.error("Не удалось изменить избранное"));
                }}
              >
                <Star className={c.isFavorite ? "fill-current" : ""} />
              </Button>
            </Card>
          ))}
        </div>
      )}
      {modal?.kind === "create" && <CardForm onClose={close} />}
      {card && modal?.kind === "edit" && <CardForm card={card} onClose={close} />}
      {card && modal?.kind === "detail" && (
        <CardDetails
          card={card}
          onClose={close}
          action={(kind) => setModal({ kind, id: card.id })}
        />
      )}
      {card && modal?.kind === "delete" && (
        <ConfirmDelete
          title={`Карта «${card.storeName}» будет удалена у обоих участников.`}
          onClose={close}
          onDelete={() => write(`/cards/${card.id}`, "delete")}
        />
      )}
    </div>
  );
}
