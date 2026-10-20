import { Checkbox, Input } from "@/shared/ui";

import type { EventFormModel } from "../model/use-event-form";

type DateForm = Pick<
  EventFormModel,
  "allDay" | "setAllDay" | "startTime" | "setStartTime" | "endTime" | "setEndTime"
> & {
  startDate: string;
  endDate: string;
  setStartDate: (date: string) => void;
  setEndDate: (date: string) => void;
};

export function EventDateFields({ form }: { form: DateForm }) {
  return (
    <div className="space-y-3 border-y border-border py-3">
      <div className="flex min-h-11 items-center">
        <Checkbox checked={form.allDay} onCheckedChange={form.setAllDay}>
          Весь день
        </Checkbox>
      </div>
      <div className="space-y-3">
        <div className="grid min-w-0 grid-cols-1 items-end gap-3 min-[375px]:grid-cols-[minmax(0,1fr)_6rem]">
          <Input
            label="Начало"
            type="date"
            required
            value={form.startDate}
            onChange={(event) => form.setStartDate(event.target.value)}
            className="min-w-0 text-base"
          />
          {!form.allDay && (
            <Input
              label="Время"
              aria-label="Время начала"
              type="time"
              required
              value={form.startTime}
              onChange={(event) => form.setStartTime(event.target.value)}
              className="min-w-0 text-base"
            />
          )}
        </div>
        <div className="grid min-w-0 grid-cols-1 items-end gap-3 min-[375px]:grid-cols-[minmax(0,1fr)_6rem]">
          <Input
            label="Окончание"
            type="date"
            required
            min={form.startDate}
            value={form.endDate}
            onChange={(event) => form.setEndDate(event.target.value)}
            className="min-w-0 text-base"
          />
          {!form.allDay && (
            <Input
              label="Время"
              aria-label="Время окончания"
              type="time"
              required
              value={form.endTime}
              onChange={(event) => form.setEndTime(event.target.value)}
              className="min-w-0 text-base"
            />
          )}
        </div>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">
        {form.allDay
          ? "Включая день окончания."
          : "После полуночи? Укажите следующую дату окончания. Время — в вашем часовом поясе."}
      </p>
    </div>
  );
}
