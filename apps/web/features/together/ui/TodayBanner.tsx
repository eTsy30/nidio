"use client";

import { TodaySummary } from "../model/task.types";

interface TodayBannerProps {
  summary: TodaySummary;
}

export function TodayBanner({ summary }: TodayBannerProps) {
  const total = summary.my + summary.partner + summary.both;
  const progress = total > 0 ? (summary.completedToday / total) * 100 : 0;

  return (
    <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-3xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold">Сегодня важно</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {total === 0 ? "Всё сделано ✨" : `${total} дел требуют внимания`}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-primary">{summary.completedToday}</p>
          <p className="text-[10px] text-primary/70 font-medium">выполнено</p>
        </div>
      </div>

      <div className="w-full h-2 bg-primary/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>

      <div className="flex gap-3">
        {summary.my > 0 && (
          <div className="text-xs">
            <span className="font-bold">{summary.my}</span>{" "}
            <span className="text-muted-foreground">мои</span>
          </div>
        )}
        {summary.partner > 0 && (
          <div className="text-xs">
            <span className="font-bold">{summary.partner}</span>{" "}
            <span className="text-muted-foreground">партнёра</span>
          </div>
        )}
        {summary.both > 0 && (
          <div className="text-xs">
            <span className="font-bold">{summary.both}</span>{" "}
            <span className="text-muted-foreground">вместе</span>
          </div>
        )}
      </div>
    </div>
  );
}
