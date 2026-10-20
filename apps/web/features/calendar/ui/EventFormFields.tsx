"use client";

import { InputControl } from "@/shared/ui/input/InputControl";
import { Textarea } from "@/shared/ui/input/Textarea";
import { Select } from "@/shared/ui/select/Select";

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
  return step === 0 ? (
    <>
      <label className="flex flex-col gap-2 text-sm font-medium">
        <span>Название</span>
        <InputControl
          required
          maxLength={200}
          autoFocus={mode === "edit"}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={mode === "create" ? "Например, вечер в кино" : undefined}
        />
      </label>
      <label className="flex flex-col gap-2 text-sm font-medium">
        <span>Тип события</span>
        <Select value={type} onChange={(e) => setType(e.target.value as EventType)}>
          {Object.values(EventType).map((value) => (
            <option key={value} value={value}>
              {typeMeta[value].label}
            </option>
          ))}
        </Select>
      </label>
      {date && (
        <label className="flex flex-col gap-2 text-sm font-medium">
          <span>Дата</span>
          <InputControl
            required
            type="date"
            value={date.value}
            onChange={(event) => date.onChange(event.target.value)}
          />
        </label>
      )}
      <label className="flex min-h-11 items-center justify-between gap-3 rounded-xl border px-3 text-sm">
        Весь день
        <InputControl
          type="checkbox"
          checked={allDay}
          onChange={(e) => setAllDay(e.target.checked)}
          className="size-5"
        />
      </label>
      {!allDay && (
        <div className="grid grid-cols-2 gap-3">
          <label className="min-w-0 flex flex-col gap-2 text-sm">
            <span>Начало</span>
            <InputControl
              required
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </label>
          <label className="min-w-0 flex flex-col gap-2 text-sm">
            <span>Конец</span>
            <InputControl
              required
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </label>
        </div>
      )}
    </>
  ) : (
    <>
      <label className="flex flex-col gap-2 text-sm font-medium">
        <span>Повторение</span>
        <Select value={repeat} onChange={(e) => setRepeat(e.target.value as EventRepeat)}>
          {repeatOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </label>
      {mode === "edit" && recurring && (
        <p className="rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground">
          Изменения применяются ко всей серии повторений.
        </p>
      )}
      <label
        className={
          mode === "create"
            ? "block min-w-0 flex flex-col gap-2 text-sm font-medium"
            : "flex flex-col gap-2 text-sm font-medium"
        }
      >
        <span>Напоминание · необязательно</span>
        <InputControl
          type="datetime-local"
          value={reminder}
          onChange={(e) => setReminder(e.target.value)}
        />
        <span className="block text-xs font-normal text-muted-foreground">
          {mode === "create" ? "В вашем часовом поясе" : "Время в вашем часовом поясе."}
        </span>
      </label>
      <label className="flex flex-col gap-2 text-sm font-medium">
        <span>Описание · необязательно</span>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={mode === "create" ? 2 : 3}
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
