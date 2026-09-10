"use client";

import { useCallback, useState } from "react";

import type { CalendarEvent } from "@/features/calendar/types";

export type CalendarModal =
  | { kind: "none" }
  | { kind: "create" }
  | { kind: "edit"; event: CalendarEvent }
  | { kind: "delete"; event: CalendarEvent };

export function useCalendarModal() {
  const [modal, setModal] = useState<CalendarModal>({ kind: "none" });

  const closeModal = useCallback(() => setModal({ kind: "none" }), []);
  const openCreate = useCallback(() => setModal({ kind: "create" }), []);
  const openEdit = useCallback((event: CalendarEvent) => setModal({ kind: "edit", event }), []);
  const openDelete = useCallback((event: CalendarEvent) => setModal({ kind: "delete", event }), []);

  return { closeModal, modal, openCreate, openDelete, openEdit };
}
