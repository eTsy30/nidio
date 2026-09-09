"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";

import { togetherKeys } from "@/features/together/api/query-keys";
import { templatesApi } from "@/features/together/api/templates.api";
import { Template } from "@/features/together/model/templates";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui";

interface TemplatePickerProps {
  open: boolean;
  onClose: () => void;
}

export function TemplatePicker({ open, onClose }: TemplatePickerProps) {
  const queryClient = useQueryClient();

  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const { data: templates = [], isLoading } = useQuery<Template[]>({
    queryKey: togetherKeys.templates(),
    queryFn: templatesApi.getAll,
    enabled: open,
  });

  const applyMutation = useMutation({
    retry: false,
    mutationFn: (templateId: string) => templatesApi.apply(templateId),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: togetherKeys.all,
      });

      setSelectedTemplate(null);
      onClose();
    },
  });

  if (!open) {
    return null;
  }

  const systemTemplates = templates.filter((template) => template.isSystem);

  const customTemplates = templates.filter((template) => !template.isSystem);

  const renderTemplate = (template: Template) => (
    <button
      key={template.id}
      type="button"
      disabled={applyMutation.isPending}
      onClick={() => setSelectedTemplate(template.id)}
      className={cn(
        "p-4 rounded-2xl border text-left transition-all",
        "disabled:opacity-50",
        selectedTemplate === template.id
          ? "border-primary bg-primary/5 ring-1 ring-primary"
          : "hover:bg-muted",
      )}
      style={{
        backgroundColor:
          selectedTemplate !== template.id ? (template.color ?? undefined) : undefined,
      }}
    >
      <p className="text-2xl mb-2">{template.icon}</p>

      <p className="text-sm font-semibold">{template.title}</p>

      <p className="text-xs text-muted-foreground mt-1">
        {template.items.length} {template.items.length === 1 ? "задача" : "задач"}
      </p>
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-overlay/60 backdrop-blur-sm" onClick={onClose} />

      <div
        className={cn(
          "relative w-full bg-card shadow-[var(--shadow-modal)]",
          "rounded-t-[var(--radius-lg)] sm:rounded-[var(--radius-lg)]",
          "sm:max-w-md sm:mx-4",
          "max-h-[85vh] overflow-y-auto",
          "animate-in slide-in-from-bottom duration-300",
          "sm:animate-none",
          "px-4 pt-5 pb-8 sm:p-6",
        )}
      >
        <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-5 sm:hidden" />

        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Шаблоны</h2>

            <p className="text-sm text-muted-foreground mt-0.5">
              Добавьте готовую колонку с задачами
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-28 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : templates.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            Нет доступных шаблонов
          </div>
        ) : (
          <div className="space-y-6">
            {systemTemplates.length > 0 && (
              <section>
                <h3 className="text-sm font-semibold mb-3">Готовые шаблоны</h3>

                <div className="grid grid-cols-2 gap-3">{systemTemplates.map(renderTemplate)}</div>
              </section>
            )}

            {customTemplates.length > 0 && (
              <section>
                <h3 className="text-sm font-semibold mb-3">Мои шаблоны</h3>

                <div className="grid grid-cols-2 gap-3">{customTemplates.map(renderTemplate)}</div>
              </section>
            )}

            <Button
              className="w-full"
              disabled={!selectedTemplate || applyMutation.isPending}
              loading={applyMutation.isPending}
              onClick={() => {
                if (selectedTemplate) {
                  applyMutation.mutate(selectedTemplate);
                }
              }}
            >
              Добавить на доску
            </Button>
          </div>
        )}

        {applyMutation.isError && (
          <p className="mt-3 text-sm text-destructive text-center">
            Не удалось применить шаблон. Попробуйте ещё раз.
          </p>
        )}
      </div>
    </div>
  );
}
