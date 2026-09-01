"use client";

import { useState } from "react";

import { Button } from "@/shared/ui";
import { CalendarEvent, EventType } from "@/widgets/calendar/model/types";

interface EditEventFormProps {
  event: CalendarEvent;
  onCancel: () => void;
  onSubmit?: (values: { title: string; description: string; type: EventType }) => void;
}

export function EditEventForm({ event, onCancel, onSubmit }: EditEventFormProps) {
  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(event.description ?? "");
  const [type, setType] = useState<EventType>(event.type);

  const handleSubmit = (formEvent: React.FormEvent<HTMLFormElement>) => {
    formEvent.preventDefault();

    if (!title.trim()) {
      return;
    }

    onSubmit?.({
      title: title.trim(),
      description: description.trim(),
      type,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="mb-1.5 block text-sm font-medium">Название</label>

        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="h-11 w-full rounded-xl border px-3 text-sm"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">Тип</label>

        <select
          value={type}
          onChange={(event) => setType(event.target.value as EventType)}
          className="h-11 w-full rounded-xl border bg-background px-3 text-sm"
        >
          <option value={EventType.DATE}>Свидание</option>

          <option value={EventType.BIRTHDAY}>День рождения</option>

          <option value={EventType.ANNIVERSARY}>Годовщина</option>

          <option value={EventType.OTHER}>Другое</option>
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">Описание</label>

        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={4}
          className="w-full resize-none rounded-xl border p-3 text-sm"
        />
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="ghost" className="flex-1" onClick={onCancel}>
          Отмена
        </Button>

        <Button type="submit" className="flex-1" disabled={!title.trim()}>
          Сохранить
        </Button>
      </div>
    </form>
  );
}
