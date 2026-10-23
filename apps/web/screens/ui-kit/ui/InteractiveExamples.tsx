"use client";
import { useState } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

import { Button, Input } from "@/shared/ui";
import { Calendar } from "@/shared/ui/calendar";
import { DataUnavailable } from "@/shared/ui/data-unavailable/DataUnavailable";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog/dialog";

import { DemoSection } from "./DemoSection";

export function InteractiveExamples() {
  const [date, setDate] = useState<Date | undefined>(new Date(2026, 9, 16));
  const [retried, setRetried] = useState(false);
  return (
    <DemoSection
      id="interactive"
      title="Календарь и диалог"
      description="Выбор даты, открытие окна, закрытие по Escape и повторная попытка."
    >
      <div className="grid items-start gap-6 md:grid-cols-2">
        <div className="min-w-0">
          <Calendar
            mode="single"
            locale={ru}
            selected={date}
            defaultMonth={new Date(2026, 9, 1)}
            onSelect={setDate}
            className="w-full max-w-sm rounded-2xl border border-border"
          />
          <p role="status" className="mt-3 text-sm text-muted-foreground">
            {date ? format(date, "d MMMM yyyy", { locale: ru }) : "Дата не выбрана"}
          </p>
        </div>
        <div className="flex flex-col items-start gap-4">
          <Dialog>
            <DialogTrigger render={<Button />}>Открыть диалог</DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Пример диалога</DialogTitle>
                <DialogDescription>Можно ввести текст. Ничего не сохраняется.</DialogDescription>
              </DialogHeader>
              <Input label="Название примера" placeholder="Введите текст" />
              <DialogFooter>
                <DialogClose render={<Button variant="secondary" />}>Отмена</DialogClose>
                <DialogClose render={<Button />}>Готово</DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <div className="w-full rounded-2xl border border-border">
            {retried ? (
              <div role="status" className="flex flex-col items-start gap-3 p-5">
                <p>Демонстрационная попытка завершена.</p>
                <Button variant="secondary" onClick={() => setRetried(false)}>
                  Показать ошибку снова
                </Button>
              </div>
            ) : (
              <DataUnavailable onRetry={() => setRetried(true)} />
            )}
          </div>
        </div>
      </div>
    </DemoSection>
  );
}
