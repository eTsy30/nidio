"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";

import { togetherKeys } from "@/features/together/api/query-keys";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui";

import { Column } from "../api/board.api";
import { templatesApi } from "../api/templates.api";
import { Template } from "../model/templates";

interface TemplatePickerProps {
  open: boolean;
  onClose: () => void;
  columns: Column[];
}

export function TemplatePicker({ open, onClose, columns }: TemplatePickerProps) {
  const queryClient = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedColumn, setSelectedColumn] = useState<string>(columns[0]?.id ?? "");

  const { data: templates = [] } = useQuery<Template[]>({
    queryKey: togetherKeys.templates(),
    queryFn: templatesApi.getAll,
    enabled: open,
  });

  const applyMutation = useMutation({
    mutationFn: ({ templateId, columnId }: { templateId: string; columnId: string }) =>
      templatesApi.apply(templateId, columnId),
    onSuccess: () => {
      // 🔧 ФИКС: инвалидируем кеш — UI сразу увидит новые задачи
      queryClient.invalidateQueries({ queryKey: togetherKeys.board() });
      queryClient.invalidateQueries({ queryKey: togetherKeys.today() });
      queryClient.invalidateQueries({ queryKey: togetherKeys.summary() });
      onClose();
      setSelectedTemplate(null);
    },
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-overlay/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cn(
          "relative w-full bg-card shadow-[var(--shadow-modal)]",
          "rounded-t-[var(--radius-lg)] sm:rounded-[var(--radius-lg)] sm:max-w-md sm:mx-4",
          "max-h-[85vh] overflow-y-auto",
          "animate-in slide-in-from-bottom duration-300 sm:animate-none",
          "px-4 pt-5 pb-8 sm:p-6",
        )}
      >
        <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-5 sm:hidden" />
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Шаблоны</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Быстро добавьте готовый список задач
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-muted transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">В колонку</label>
            <select
              value={selectedColumn}
              onChange={(e) => setSelectedColumn(e.target.value)}
              className="h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary"
            >
              {columns.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.title}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {templates.map((t: Template) => (
              <button
                key={t.id}
                onClick={() => setSelectedTemplate(t.id)}
                className={cn(
                  "p-4 rounded-2xl border text-left transition-all",
                  selectedTemplate === t.id
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "hover:bg-muted",
                )}
                style={{ backgroundColor: t.color ?? undefined }}
              >
                <p className="text-2xl mb-2">{t.icon}</p>
                <p className="text-sm font-semibold">{t.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{t.items.length} задач</p>
              </button>
            ))}
          </div>

          <Button
            className="w-full"
            disabled={!selectedTemplate || applyMutation.isPending}
            loading={applyMutation.isPending}
            onClick={() => {
              if (selectedTemplate) {
                applyMutation.mutate({ templateId: selectedTemplate, columnId: selectedColumn });
              }
            }}
          >
            Применить шаблон
          </Button>
        </div>
      </div>
    </div>
  );
}
