"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Heart } from "lucide-react";

interface EmptyDayMessageProps {
  date: Date;
}

const messages = [
  {
    title: "Сегодня свободно",
    text: "Может, запланируете что-нибудь вместе?",
  },
  {
    title: "День без планов",
    text: "Иногда лучший момент — тот, который вы придумали сами.",
  },
  {
    title: "Можно придумать что-нибудь",
    text: "Даже маленький момент может стать вашим воспоминанием.",
  },
  {
    title: "Время для вас",
    text: "Почему бы не добавить что-нибудь особенное?",
  },
];

export function EmptyDayMessage({ date }: EmptyDayMessageProps) {
  const message = useMemo(() => {
    const index = Math.abs(date.getDate()) % messages.length;

    return messages[index];
  }, [date]);

  return (
    <div className="relative mt-6 overflow-hidden rounded-2xl bg-muted/40 p-4">
      <div className="relative z-10 max-w-[72%]">
        <p className="text-base font-semibold leading-snug">{message?.title}</p>

        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{message?.text}</p>

        <p className="mt-2 text-[10px] text-muted-foreground">
          {format(date, "EEEE", {
            locale: ru,
          })}
        </p>
      </div>

      <div className="absolute -bottom-3 -right-2 flex items-end gap-1 opacity-50">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-200/70">
          <Heart className="h-5 w-5 fill-amber-400 text-amber-400" />
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-200/70">
          <Heart className="h-3.5 w-3.5 fill-rose-400 text-rose-400" />
        </div>
      </div>
    </div>
  );
}
