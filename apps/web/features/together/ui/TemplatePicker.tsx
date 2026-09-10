"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { togetherKeys } from "@/features/together/api/query-keys";
import { templatesApi } from "@/features/together/api/templates.api";
import { Template } from "@/features/together/model/templates";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/shared/ui/dialog/dialog";

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
    <Dialog open={open} onOpenChange={(next) => !next && !applyMutation.isPending && onClose()}>
      <DialogContent className="z-[60] max-h-[calc(100dvh-92px-env(safe-area-inset-bottom))] w-[calc(100%-2rem)] overflow-y-auto rounded-2xl p-5 sm:max-h-[calc(100dvh-2rem)] sm:max-w-md">
        <div className="pr-8">
          <DialogTitle>Шаблоны</DialogTitle>
          <DialogDescription>Добавьте готовую колонку с задачами</DialogDescription>
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
      </DialogContent>
    </Dialog>
  );
}
