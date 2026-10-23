"use client";
import { useState } from "react";
import { Pencil, Plus, Search, Star } from "lucide-react";
import { toast } from "sonner";

import { Button, Card, Input } from "@/shared/ui";

import { useFinance } from "../api/FinanceProvider";
import { cardTones, categoryName } from "../model/constants";
import type { CardTone } from "../model/types";

import { CardCategorySelect } from "./cards/CardCategorySelect";
import { CardDetails } from "./CardDetails";
import { CardForm } from "./CardForm";
import { ConfirmDelete } from "./FinanceDialog";
import { FinanceEmpty } from "./FinanceEmpty";
export function CardsTab() {
  const { data, write, busy } = useFinance();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [modal, setModal] = useState<{ kind: string; id?: string; keyboard?: boolean } | null>(
    null,
  );
  const card = data.cards.find((c) => c.id === modal?.id);
  const close = () => setModal(null);
  const cards = data.cards
    .filter(
      (c) =>
        (category === "ALL" ||
          (category === "FAVORITES" ? c.isFavorite : c.category === category)) &&
        `${c.storeName} ${c.cardNumber} ${categoryName(c.category)}`
          .toLocaleLowerCase()
          .replace(/\s/g, "")
          .includes(search.toLocaleLowerCase().replace(/\s/g, "")),
    )
    .sort((a, b) => a.storeName.localeCompare(b.storeName, "ru"));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Наши карты</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            В общей коллекции: {data.cards.length}
          </p>
        </div>
        <Button
          leftIcon={<Plus />}
          onClick={() => {
            setModal({ kind: "create" });
          }}
        >
          Добавить карту
        </Button>
      </div>
      {data.cards.length > 0 && (
        <>
          <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
            <Input
              label="Найти карту"
              leftIcon={<Search />}
              placeholder="Магазин или номер"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <CardCategorySelect filter value={category} onChange={setCategory} />
          </div>
        </>
      )}
      {!cards.length ? (
        <FinanceEmpty title={data.cards.length ? "Ничего не найдено" : "Одна карта — для двоих"}>
          {data.cards.length
            ? "Измените запрос или категорию."
            : "Добавьте первую скидочную карту. Партнёр тоже сможет показать её на кассе."}
          <Button
            className="mt-4"
            variant="secondary"
            onClick={() => {
              if (data.cards.length) {
                setSearch("");
                setCategory("ALL");
              } else {
                setModal({ kind: "create" });
              }
            }}
          >
            {data.cards.length ? "Сбросить поиск и фильтры" : "Добавить первую карту"}
          </Button>
        </FinanceEmpty>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <Card
              padding="sm"
              key={c.id}
              className={`relative min-w-0 rounded-md border border-border/60 ${
                cardTones[c.color as CardTone]?.surface ?? cardTones.blue.surface
              }`}
            >
              <Button
                variant="plain"
                size="none"
                className="min-h-28 w-full space-y-4 px-10 py-2 text-center"
                onClick={(event) => {
                  setModal({ kind: "detail", id: c.id, keyboard: event.detail === 0 });
                  void write(`/cards/${c.id}/used`, "post").catch(() =>
                    toast.error("Не удалось обновить время открытия"),
                  );
                }}
              >
                <span className="block break-words text-xl font-semibold text-white">
                  {c.storeName}
                </span>
                <span className="block text-xs font-semibold text-[#FFF1D6]">
                  {categoryName(c.category)}
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
              <Button
                variant="icon"
                iconOnly
                className="absolute bottom-2 right-2"
                aria-label={`Изменить карту ${c.storeName}`}
                onClick={() => setModal({ kind: "edit", id: c.id })}
              >
                <Pencil />
              </Button>
            </Card>
          ))}
        </div>
      )}
      {modal?.kind === "create" && <CardForm onClose={close} />}
      {card && modal?.kind === "edit" && (
        <CardForm
          card={card}
          onClose={close}
          onDelete={() => setModal({ kind: "delete", id: card.id })}
        />
      )}
      {card && modal?.kind === "detail" && (
        <CardDetails card={card} onClose={close} animate={!modal.keyboard} />
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
