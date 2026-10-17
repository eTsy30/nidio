import { SlidersHorizontal } from "lucide-react";

import { typeMeta } from "@/features/calendar/model/constants";
import { EventType, type ViewMode } from "@/features/calendar/types";
import { Button } from "@/shared/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog/dialog";

interface Props {
  viewMode: ViewMode;
  filter: EventType | "ALL";
  onViewModeChange: (view: ViewMode) => void;
  onFilterChange: (filter: EventType | "ALL") => void;
}
export function CalendarOptions({ viewMode, filter, onViewModeChange, onFilterChange }: Props) {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            iconOnly
            className="size-11"
            aria-label="Настройки календаря"
            leftIcon={<SlidersHorizontal />}
          />
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Настройки календаря</DialogTitle>
          <DialogDescription>Выберите вид и события для отображения.</DialogDescription>
        </DialogHeader>
        <fieldset className="space-y-3">
          <legend className="mb-2 text-sm font-semibold">Вид календаря</legend>
          <div className="flex flex-wrap gap-2">
            {(["month", "week", "year"] as const).map((view) => (
              <Button
                key={view}
                variant={view === viewMode ? "primary" : "secondary"}
                aria-pressed={view === viewMode}
                onClick={() => onViewModeChange(view)}
              >
                {{ month: "Месяц", week: "Неделя", year: "Год" }[view]}
              </Button>
            ))}
          </div>
        </fieldset>
        <fieldset className="space-y-3">
          <legend className="mb-2 text-sm font-semibold">Тип события</legend>
          <div className="flex flex-wrap gap-2">
            {(["ALL", ...Object.values(EventType)] as const).map((type) => (
              <Button
                key={type}
                variant={type === filter ? "primary" : "secondary"}
                aria-pressed={type === filter}
                onClick={() => onFilterChange(type)}
              >
                {type === "ALL" ? "Все события" : typeMeta[type].label}
              </Button>
            ))}
          </div>
        </fieldset>
      </DialogContent>
    </Dialog>
  );
}
