"use client";

import { useEffect, useRef, useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MoreVertical, Plus, Save, Trash2, X } from "lucide-react";

import { boardApi } from "@/features/together/api/board.api";
import { togetherKeys } from "@/features/together/api/query-keys";
import { templatesApi } from "@/features/together/api/templates.api";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui";

import { Column } from "../api/board.api";
import { TogetherTask } from "../model/task.types";

import { SortableTaskCard } from "./SortableTaskCard";

interface ColumnCardProps {
  column: Column;
  tasks: TogetherTask[];
  currentUserId: string;
  partnerId?: string | undefined;
  partnerName?: string | undefined;
  partnerAvatarUrl?: string | null | undefined;
  onCreateTask: () => void;
  onEditTask: (task: TogetherTask) => void;
}

export function ColumnCard({
  column,
  tasks,
  currentUserId,
  partnerId,
  partnerName,
  partnerAvatarUrl,
  onCreateTask,
  onEditTask,
}: ColumnCardProps) {
  const queryClient = useQueryClient();

  const menuRef = useRef<HTMLDivElement>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `col-${column.id}`,
    data: {
      type: "column",
      columnId: column.id,
    },
  });

  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
  } = useSortable({
    id: column.id,
    data: {
      type: "column",
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  useEffect(() => {
    if (!showMenu) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;

      if (!(target instanceof Node)) {
        return;
      }

      if (!menuRef.current?.contains(target)) {
        setShowMenu(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [showMenu]);

  const deleteMutation = useMutation({
    retry: false,
    mutationFn: boardApi.deleteColumn,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: togetherKeys.all,
      });
    },
  });

  const saveTemplateMutation = useMutation({
    retry: false,
    mutationFn: () => templatesApi.createFromColumn(column.id, templateName.trim() || column.title),

    onSuccess: () => {
      setShowSaveTemplate(false);
      setTemplateName("");
      setShowMenu(false);
    },
  });

  const completedCount = tasks.filter((task) => task.completed).length;

  const handleToggleMenu = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    setShowMenu((state) => !state);
  };

  const handleSaveAsTemplate = () => {
    setShowMenu(false);
    setShowSaveTemplate(true);
  };

  const handleDelete = () => {
    setShowMenu(false);
    deleteMutation.mutate(column.id);
  };

  return (
    <div ref={setSortableRef} style={style} className="w-72 shrink-0 flex flex-col">
      <div
        className={cn(
          "rounded-3xl border p-3 flex flex-col gap-3 transition-colors",
          isOver && "ring-2 ring-primary/30",
        )}
        style={{
          backgroundColor: column.color ?? "#F5F5F5",
        }}
      >
        <div className="flex items-center justify-between px-1">
          <div
            className="flex items-center gap-2 min-w-0 cursor-grab active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            {column.icon && <span className="text-lg">{column.icon}</span>}

            <h3 className="text-sm font-bold truncate">{column.title}</h3>

            <span className="text-xs text-muted-foreground font-medium shrink-0">
              {completedCount}/{tasks.length}
            </span>
          </div>

          <div ref={menuRef} className="relative shrink-0">
            <button
              type="button"
              aria-label="Меню колонки"
              aria-expanded={showMenu}
              onPointerDown={(event) => {
                event.stopPropagation();
              }}
              onClick={handleToggleMenu}
              className="p-1.5 rounded-full hover:bg-black/5 transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-muted-foreground" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-8 z-20 w-48 bg-card border rounded-xl shadow-lg p-1">
                <button
                  type="button"
                  onPointerDown={(event) => {
                    event.stopPropagation();
                  }}
                  onClick={handleSaveAsTemplate}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-lg hover:bg-muted transition-colors text-left"
                >
                  <Save className="w-3.5 h-3.5" />
                  Сохранить как шаблон
                </button>

                <button
                  type="button"
                  disabled={deleteMutation.isPending}
                  onPointerDown={(event) => {
                    event.stopPropagation();
                  }}
                  onClick={handleDelete}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-lg hover:bg-destructive/10 text-destructive transition-colors text-left disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Удалить
                </button>
              </div>
            )}
          </div>
        </div>

        {showSaveTemplate && (
          <div className="bg-white/80 rounded-xl p-2 space-y-2">
            <input
              type="text"
              value={templateName}
              onChange={(event) => setTemplateName(event.target.value)}
              placeholder="Название шаблона"
              className="w-full h-8 rounded-lg border bg-background px-2 text-xs outline-none focus:border-primary"
              autoFocus
            />

            <div className="flex gap-1">
              <Button
                size="sm"
                className="flex-1 h-7 text-xs"
                disabled={saveTemplateMutation.isPending}
                loading={saveTemplateMutation.isPending}
                onClick={() => saveTemplateMutation.mutate()}
              >
                Сохранить
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs px-2"
                onClick={() => {
                  setShowSaveTemplate(false);
                  setTemplateName("");
                }}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}

        <div
          ref={setDroppableRef}
          className={cn("space-y-2 min-h-[60px] flex-1", isOver && "bg-primary/5 rounded-xl")}
        >
          <SortableContext
            items={tasks.map((task) => task.id)}
            strategy={verticalListSortingStrategy}
          >
            {tasks.map((task) => (
              <SortableTaskCard
                key={task.id}
                task={task}
                currentUserId={currentUserId}
                partnerId={partnerId}
                partnerName={partnerName}
                partnerAvatarUrl={partnerAvatarUrl}
                onEdit={onEditTask}
              />
            ))}
          </SortableContext>
        </div>

        <button
          type="button"
          onClick={onCreateTask}
          className={cn(
            "w-full h-9 rounded-xl border border-dashed border-border/60",
            "flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground",
            "hover:border-primary hover:text-primary transition-colors bg-white/50",
          )}
        >
          <Plus className="w-3.5 h-3.5" />
          Добавить задачу
        </button>
      </div>
    </div>
  );
}
