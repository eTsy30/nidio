import { CalendarDays, Heart, PartyPopper, Sparkles } from "lucide-react";

import { EventType } from "@/features/calendar/types";

export const EVENT_TYPES = [
  EventType.DATE,
  EventType.BIRTHDAY,
  EventType.ANNIVERSARY,
  EventType.OTHER,
] as const;

export const typeMeta: Record<
  EventType,
  {
    label: string;
    color: string;
    bg: string;
    border: string;
  }
> = {
  [EventType.DATE]: {
    label: "Свидание",
    color: "text-rose-700",
    bg: "bg-rose-100",
    border: "#fb7185",
  },

  [EventType.BIRTHDAY]: {
    label: "День рождения",
    color: "text-pink-700",
    bg: "bg-pink-100",
    border: "#f472b6",
  },

  [EventType.ANNIVERSARY]: {
    label: "Годовщина",
    color: "text-amber-700",
    bg: "bg-amber-100",
    border: "#fbbf24",
  },

  [EventType.OTHER]: {
    label: "Другое",
    color: "text-sky-700",
    bg: "bg-sky-100",
    border: "#38bdf8",
  },
};

export const typeIcon = {
  [EventType.DATE]: Heart,
  [EventType.BIRTHDAY]: PartyPopper,
  [EventType.ANNIVERSARY]: Sparkles,
  [EventType.OTHER]: CalendarDays,
} as const;

export const repeatOptions = [
  {
    value: "NONE",
    label: "Не повторять",
  },
  {
    value: "DAILY",
    label: "Каждый день",
  },
  {
    value: "WEEKLY",
    label: "Каждую неделю",
  },
  {
    value: "MONTHLY",
    label: "Каждый месяц",
  },
  {
    value: "YEARLY",
    label: "Каждый год",
  },
] as const;
