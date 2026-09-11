"use client";

import { type FormEvent, useState } from "react";

import type { CalendarEventFormValues, EventRepeat, EventType } from "../types";

type EventFormInitialValues = {
  title: string;
  description: string;
  type: EventType;
  allDay: boolean;
  startTime: string;
  endTime: string;
  repeat: EventRepeat;
  reminder: string;
};

function parseTime(value: string): [number, number] {
  const [hours = 0, minutes = 0] = value.split(":").map(Number);
  return [hours, minutes];
}

export function useEventForm(
  date: Date,
  initial: EventFormInitialValues,
  onSubmit?: (values: CalendarEventFormValues) => void | Promise<void>,
) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [type, setType] = useState(initial.type);
  const [allDay, setAllDay] = useState(initial.allDay);
  const [startTime, setStartTime] = useState(initial.startTime);
  const [endTime, setEndTime] = useState(initial.endTime);
  const [repeat, setRepeat] = useState(initial.repeat);
  const [reminder, setReminder] = useState(initial.reminder);
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (step === 0) {
      setStep(1);
      return;
    }
    if (saving) return;
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      return;
    }

    const startAt = new Date(date);

    if (allDay) {
      startAt.setHours(0, 0, 0, 0);
    } else {
      const [hours, minutes] = parseTime(startTime);

      startAt.setHours(hours, minutes, 0, 0);
    }

    let endAt: Date | null = null;

    if (!allDay) {
      endAt = new Date(date);

      const [hours, minutes] = parseTime(endTime);

      endAt.setHours(hours, minutes, 0, 0);
    }

    if (endAt && endAt <= startAt) {
      setError("Конец должен быть позже начала");
      setStep(0);
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSubmit?.({
        title: trimmedTitle,
        description: description.trim(),
        type,
        startAt,
        endAt,
        allDay,
        repeat,
        reminderAt: reminder ? new Date(reminder) : null,
      });
    } catch {
      setError("Не удалось сохранить событие. Попробуйте ещё раз.");
    } finally {
      setSaving(false);
    }
  };

  return {
    step,
    setStep,
    saving,
    error,
    title,
    setTitle,
    description,
    setDescription,
    type,
    setType,
    allDay,
    setAllDay,
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    repeat,
    setRepeat,
    reminder,
    setReminder,
    handleSubmit,
  };
}

export type EventFormModel = ReturnType<typeof useEventForm>;
