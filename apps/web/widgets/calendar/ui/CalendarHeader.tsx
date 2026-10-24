"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
  CalendarDays,
  CalendarRange,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Grid2X2,
  Layers,
  User,
  Users,
} from "lucide-react";

import { typeIcon, typeMeta } from "@/features/calendar/model/constants";
import { Button, ChoiceButton } from "@/shared/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog/dialog";
import { IconSelect } from "@/shared/ui/select/IconSelect";

import { EventScope, EventType, ViewMode } from "../model/types";

interface CalendarHeaderProps {
  month: Date;
  scope: EventScope;
  viewMode: ViewMode;
  filter: EventType | "ALL";
  onScopeChange: (scope: EventScope) => void;
  onViewModeChange: (view: ViewMode) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onMonthChange: (month: Date) => void;
  onFilterChange: (value: EventType | "ALL") => void;
}

export function CalendarHeader({
  month,
  scope,
  viewMode,
  filter,
  onScopeChange,
  onViewModeChange,
  onPrev,
  onNext,
  onToday,
  onMonthChange,
  onFilterChange,
}: CalendarHeaderProps) {
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const currentYear = month.getFullYear();
  return (
    <header className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Календарь</h1>
          <p className="mt-2 text-sm text-muted-foreground">Ваши планы и общие моменты</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <IconSelect
          label="Календарь"
          value={scope}
          onChange={(value) => onScopeChange(value as EventScope)}
          options={[
            { value: EventScope.PERSONAL, label: "Мой", icon: <User className="size-4" /> },
            { value: EventScope.COUPLE, label: "Наш", icon: <Users className="size-4" /> },
          ]}
        />
        <IconSelect
          label="Вид"
          value={viewMode}
          onChange={(value) => onViewModeChange(value as ViewMode)}
          options={[
            { value: "month", label: "Месяц", icon: <CalendarDays className="size-4" /> },
            { value: "week", label: "Неделя", icon: <CalendarRange className="size-4" /> },
            { value: "year", label: "Год", icon: <Grid2X2 className="size-4" /> },
          ]}
        />
        <div className="col-span-2 sm:col-span-1">
          <IconSelect
            label="События"
            value={filter}
            onChange={(value) => onFilterChange(value as EventType | "ALL")}
            options={[
              { value: "ALL", label: "Все события", icon: <Layers className="size-4" /> },
              ...Object.values(EventType).map((type) => {
                const Icon = typeIcon[type];
                return {
                  value: type,
                  label: typeMeta[type].label,
                  icon: <Icon className="size-4" />,
                };
              }),
            ]}
          />
        </div>
      </div>
      <div className="flex items-center justify-between gap-1">
        <Button
          variant="secondary"
          onClick={() => setMonthPickerOpen(true)}
          rightIcon={<ChevronDown className="hidden sm:block" />}
          className="min-w-0 px-2 text-sm capitalize"
        >
          {format(month, "LLLL yyyy", { locale: ru })}
        </Button>
        <div className="flex shrink-0 items-center gap-0 sm:gap-2">
          <Button
            variant="ghost"
            iconOnly
            className="w-9 sm:w-11"
            aria-label="Предыдущий период"
            onClick={onPrev}
          >
            <ChevronLeft />
          </Button>
          <Button variant="ghost" className="px-1 text-xs sm:px-3 sm:text-sm" onClick={onToday}>
            Сегодня
          </Button>
          <Button
            variant="ghost"
            iconOnly
            className="w-9 sm:w-11"
            aria-label="Следующий период"
            onClick={onNext}
          >
            <ChevronRight />
          </Button>
        </div>
      </div>
      <Dialog open={monthPickerOpen} onOpenChange={setMonthPickerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Выбрать месяц</DialogTitle>
            <DialogDescription>Перейдите к нужному месяцу и году.</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-between">
            <Button
              variant="secondary"
              iconOnly
              aria-label="Предыдущий год"
              onClick={() => onMonthChange(new Date(currentYear - 1, month.getMonth(), 1))}
            >
              <ChevronLeft />
            </Button>
            <span className="text-lg font-semibold">{currentYear}</span>
            <Button
              variant="secondary"
              iconOnly
              aria-label="Следующий год"
              onClick={() => onMonthChange(new Date(currentYear + 1, month.getMonth(), 1))}
            >
              <ChevronRight />
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 12 }, (_, index) => (
              <ChoiceButton
                key={index}
                selected={index === month.getMonth()}
                className="capitalize"
                onClick={() => {
                  onMonthChange(new Date(currentYear, index, 1));
                  setMonthPickerOpen(false);
                }}
              >
                {format(new Date(currentYear, index, 1), "LLL", { locale: ru })}
              </ChoiceButton>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}
