"use client";

import { repeatOptions, typeMeta } from "../model/constants";
import type { EventFormModel } from "../model/use-event-form";
import { EventRepeat, EventType } from "../types";

interface EventFormFieldsProps {
  form: EventFormModel;
  mode: "create" | "edit";
  date?: { value: string; onChange: (value: string) => void };
  recurring?: boolean;
}

export function EventFormFields({ form, mode, date, recurring }: EventFormFieldsProps) {
  const {
    step,
    title,
    setTitle,
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
    description,
    setDescription,
  } = form;
  const inputClass =
    "h-11 min-w-0 w-full rounded-xl border bg-background px-3 text-base outline-none focus:border-primary";
  return step === 0 ? (
    <>
      <label className="block space-y-1 text-sm font-medium">
        <span>Название</span>
        <input
          required
          maxLength={200}
          autoFocus={mode === "edit"}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={mode === "create" ? "Например, вечер в кино" : undefined}
          className={inputClass}
        />
      </label>
      <label className="block space-y-1 text-sm font-medium">
        <span>Тип события</span>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as EventType)}
          className={inputClass}
        >
          {Object.values(EventType).map((value) => (
            <option key={value} value={value}>
              {typeMeta[value].label}
            </option>
          ))}
        </select>
      </label>
      {date && (
        <label className="block space-y-1 text-sm font-medium">
          <span>Дата</span>
          <input
            required
            type="date"
            value={date.value}
            onChange={(event) => date.onChange(event.target.value)}
            className={inputClass}
          />
        </label>
      )}
      <label className="flex min-h-11 items-center justify-between gap-3 rounded-xl border px-3 text-sm">
        Весь день
        <input
          type="checkbox"
          checked={allDay}
          onChange={(e) => setAllDay(e.target.checked)}
          className="size-5"
        />
      </label>
      {!allDay && (
        <div className="grid grid-cols-2 gap-3">
          <label className="min-w-0 space-y-1 text-sm">
            <span>Начало</span>
            <input
              required
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="min-w-0 space-y-1 text-sm">
            <span>Конец</span>
            <input
              required
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className={inputClass}
            />
          </label>
        </div>
      )}
    </>
  ) : (
    <>
      <label className="block space-y-1 text-sm font-medium">
        <span>Повторение</span>
        <select
          value={repeat}
          onChange={(e) => setRepeat(e.target.value as EventRepeat)}
          className={inputClass}
        >
          {repeatOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      {mode === "edit" && recurring && (
        <p className="rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground">
          Изменения применяются ко всей серии повторений.
        </p>
      )}
      <label
        className={
          mode === "create"
            ? "block min-w-0 space-y-1 text-sm font-medium"
            : "block space-y-1 text-sm font-medium"
        }
      >
        <span>Напоминание · необязательно</span>
        <input
          type="datetime-local"
          value={reminder}
          onChange={(e) => setReminder(e.target.value)}
          className={inputClass}
        />
        <span className="block text-xs font-normal text-muted-foreground">
          {mode === "create" ? "В вашем часовом поясе" : "Время в вашем часовом поясе."}
        </span>
      </label>
      <label className="block space-y-1 text-sm font-medium">
        <span>Описание · необязательно</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={mode === "create" ? 2 : 3}
          className="w-full resize-none rounded-xl border bg-background p-3 text-base"
        />
      </label>
      {(type === EventType.BIRTHDAY || type === EventType.ANNIVERSARY) && (
        <p className="text-xs text-muted-foreground">
          В день события также придёт push в 12:00 по часовому поясу получателя.
        </p>
      )}
    </>
  );
}
