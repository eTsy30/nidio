"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { ChevronDown, ChevronLeft, ChevronRight, ListFilter } from "lucide-react";

import { EventFilter } from "@/features/calendar/event-filter/ui/EventFilter";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui";

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
  const [filterOpen, setFilterOpen] = useState(false);

  const currentYear = month.getFullYear();
  const currentMonth = month.getMonth();

  const months = Array.from({ length: 12 }, (_, index) => new Date(currentYear, index, 1));

  const handleMonthChange = (date: Date) => {
    onMonthChange(date);
  };

  return (
    <header className="border-b bg-background px-3 py-3 sm:px-5">
      <div className="grid min-h-10 grid-cols-[1fr_auto] items-center gap-2 xl:grid-cols-[auto_1fr_auto]">
        <div className="flex shrink-0 items-center rounded-xl bg-muted p-1">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<ChevronLeft className="h-4 w-4" />}
            onClick={onPrev}
            className="h-8 w-8 rounded-lg"
            aria-label="Предыдущий период"
          ></Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onToday}
            className="h-8 rounded-lg px-2.5 text-sm font-medium sm:px-3"
          >
            Сегодня
          </Button>

          <Button
            variant="ghost"
            size="sm"
            rightIcon={<ChevronRight className="h-4 w-4" />}
            onClick={onNext}
            className="h-8 w-8 rounded-lg"
            aria-label="Следующий период"
          ></Button>
        </div>

        <div className="order-3 col-span-2 flex min-w-0 flex-wrap items-center justify-between gap-2 xl:order-none xl:col-span-1 xl:justify-center">
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setMonthPickerOpen((open) => !open);
                setFilterOpen(false);
              }}
              className={cn(
                "flex h-10 items-center gap-1.5 rounded-xl px-2.5 sm:px-3",
                "text-sm font-semibold capitalize sm:text-base",
                "transition-colors hover:bg-muted",
                monthPickerOpen && "bg-muted",
              )}
              aria-expanded={monthPickerOpen}
              aria-haspopup="dialog"
            >
              <span>
                {format(month, "LLLL yyyy", {
                  locale: ru,
                })}
              </span>

              <ChevronDown
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform",
                  monthPickerOpen && "rotate-180",
                )}
              />
            </button>

            {monthPickerOpen && (
              <>
                <button
                  type="button"
                  aria-label="Закрыть выбор месяца"
                  className="fixed inset-0 z-40 cursor-default"
                  onClick={() => setMonthPickerOpen(false)}
                />

                <div
                  className="absolute left-0 top-full z-50 mt-2 w-72 max-w-[calc(100vw-24px)] rounded-2xl border bg-background p-3 shadow-xl"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleMonthChange(new Date(currentYear - 1, currentMonth, 1))}
                      className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:bg-muted"
                      aria-label="Предыдущий год"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>

                    <span className="text-sm font-semibold">{currentYear}</span>

                    <button
                      type="button"
                      onClick={() => handleMonthChange(new Date(currentYear + 1, currentMonth, 1))}
                      className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:bg-muted"
                      aria-label="Следующий год"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-1">
                    {months.map((date) => {
                      const selected = date.getMonth() === currentMonth;

                      return (
                        <button
                          key={date.getMonth()}
                          type="button"
                          onClick={() => {
                            handleMonthChange(date);
                            setMonthPickerOpen(false);
                          }}
                          className={cn(
                            "rounded-xl px-2 py-2.5 text-sm capitalize transition-colors",
                            selected ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                          )}
                        >
                          {format(date, "LLL", {
                            locale: ru,
                          })}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex shrink-0 items-center rounded-xl bg-muted p-1">
            {(["week", "month", "year"] as ViewMode[]).map((view) => (
              <button
                key={view}
                type="button"
                onClick={() => {
                  onViewModeChange(view);
                  setMonthPickerOpen(false);
                }}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                  "sm:px-4 sm:text-sm",
                  viewMode === view
                    ? "bg-background text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {view === "month" ? "Месяц" : view === "week" ? "Неделя" : "Год"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="flex items-center rounded-xl bg-muted p-1">
            <button
              type="button"
              onClick={() => onScopeChange(EventScope.PERSONAL)}
              className={cn(
                "rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all",
                "sm:px-3 sm:text-sm",
                scope === EventScope.PERSONAL
                  ? "bg-background text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Мой
            </button>

            <button
              type="button"
              onClick={() => onScopeChange(EventScope.COUPLE)}
              className={cn(
                "rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all",
                "sm:px-3 sm:text-sm",
                scope === EventScope.COUPLE
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Наш
            </button>
          </div>

          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<ListFilter className="h-4 w-4" />}
              onClick={() => {
                setFilterOpen((open) => !open);
                setMonthPickerOpen(false);
              }}
              className={cn(
                "h-10 w-10 rounded-xl",
                filter !== "ALL" && "bg-primary/10 text-primary",
              )}
              aria-label="Фильтр событий"
              aria-expanded={filterOpen}
              aria-haspopup="dialog"
            ></Button>

            {filterOpen && (
              <>
                <button
                  type="button"
                  aria-label="Закрыть фильтр"
                  className="fixed inset-0 z-40 cursor-default"
                  onClick={() => setFilterOpen(false)}
                />

                <div
                  className="absolute right-0 top-full z-50 mt-2"
                  onClick={(event) => event.stopPropagation()}
                >
                  <EventFilter
                    value={filter}
                    onChange={(value) => {
                      onFilterChange(value);
                      setFilterOpen(false);
                    }}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
