"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Shuffle, Sparkles } from "lucide-react";

const ideas = [
  {
    title: "Вечер без спешки",
    text: "Приготовьте что-нибудь вместе и оставьте телефоны в другой комнате. Только вы и разговоры обо всём.",
  },
  {
    title: "Новый маршрут",
    text: "Пройдитесь по незнакомой улице. По очереди выбирайте повороты и найдите своё новое любимое место.",
  },
  {
    title: "Плейлист для двоих",
    text: "Выберите по три песни, с которыми связаны ваши воспоминания. Послушайте их вместе и расскажите друг другу почему.",
  },
  {
    title: "Маленькое спасибо",
    text: "Вспомните одну вещь, за которую вы благодарны друг другу сегодня. Иногда самое важное помещается в одну фразу.",
  },
] as const;

export function HomeIdea() {
  const [index, setIndex] = useState(0);
  const idea = ideas[index] ?? ideas[0];
  return (
    <section className="rounded-3xl border border-success/15 bg-success/5 p-6 sm:p-7">
      <div className="flex items-center justify-between gap-3">
        <p className="eyebrow flex items-center gap-2 text-success">
          <Sparkles className="size-4" aria-hidden="true" />
          Идея для вас
        </p>
        <button
          type="button"
          onClick={() => setIndex((value) => (value + 1) % ideas.length)}
          className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-xs font-medium text-foreground transition-colors hover:bg-success/10"
          aria-label="Показать другую идею"
        >
          <Shuffle className="size-4" aria-hidden="true" />
          Другая
        </button>
      </div>
      <div key={index} className="animate-fade-up" aria-live="polite" aria-atomic="true">
        <h2 className="mt-4 text-xl font-semibold">{idea.title}</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{idea.text}</p>
      </div>
      <Link
        href="/calendar?scope=couple"
        className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-success hover:no-underline"
      >
        Выбрать день в календаре
        <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
    </section>
  );
}
