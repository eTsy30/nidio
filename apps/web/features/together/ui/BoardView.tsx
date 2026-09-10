"use client";

import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";

import { boardApi } from "@/features/together/api/board.api";
import { togetherKeys } from "@/features/together/api/query-keys";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui";

import type { Board } from "../api/board.api";
import { isTaskOverdue } from "../lib/task-utils";
import { getTaskMove } from "../model/board-dnd";
import type { TaskFilter, TogetherTask } from "../model/task.types";
import { useBoardMutations } from "../model/use-board-mutations";

import { ColumnCard } from "./ColumnCard";
import { TaskCard } from "./TaskCard";

interface BoardViewProps {
  board: Board;
  filter: TaskFilter;
  currentUserId: string;
  partnerId: string | undefined;
  partnerName: string | undefined;
  partnerAvatarUrl: string | null | undefined;
  onCreateTask: (columnId: string) => void;
  onEditTask: (task: TogetherTask) => void;
}

type TaskViewMode = "active" | "completed";

export function BoardView({
  board,
  filter,
  currentUserId,
  partnerId,
  partnerName,
  partnerAvatarUrl,
  onCreateTask,
  onEditTask,
}: BoardViewProps) {
  const queryClient = useQueryClient();

  const [taskViewMode, setTaskViewMode] = useState<TaskViewMode>("active");

  const [activeTask, setActiveTask] = useState<TogetherTask | null>(null);

  const [newColumnTitle, setNewColumnTitle] = useState("");

  const [isAdding, setIsAdding] = useState(false);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  /**
   * Фильтрация задач внутри колонок.
   *
   * Режим active/completed применяется
   * отдельно от существующего фильтра
   * assignee.
   */
  const filterTasks = (tasks: TogetherTask[]): TogetherTask[] => {
    const tasksByMode = tasks.filter((task) =>
      taskViewMode === "completed" ? task.completed : !task.completed,
    );

    switch (filter) {
      case "all":
        return tasksByMode;

      case "me":
        return tasksByMode.filter(
          (task) => task.assigneeId === currentUserId && task.assigneeMode !== "BOTH",
        );

      case "partner":
        return tasksByMode.filter(
          (task) =>
            Boolean(task.assigneeId) &&
            task.assigneeId !== currentUserId &&
            task.assigneeMode !== "BOTH",
        );

      case "together":
        return tasksByMode.filter((task) => task.assigneeMode === "BOTH");

      case "rotate":
        return tasksByMode.filter((task) => task.assigneeMode === "ROTATE");

      default:
        return tasksByMode;
    }
  };

  /**
   * Создание колонки.
   */
  const createColumnMutation = useMutation({
    retry: false,
    mutationFn: boardApi.createColumn,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: togetherKeys.all,
      });

      setNewColumnTitle("");
      setIsAdding(false);
    },
  });

  const { moveTaskMutation, reorderColumnsMutation } = useBoardMutations();

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;

    if (active.data.current?.type !== "task") {
      return;
    }

    const task = active.data.current.task as TogetherTask | undefined;

    if (!task) {
      return;
    }

    if (task.completed || isTaskOverdue(task)) {
      return;
    }

    setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveTask(null);

    if (active.data.current?.type === "task") {
      const task = active.data.current.task as TogetherTask | undefined;

      if (!task || task.completed || isTaskOverdue(task)) {
        return;
      }
    }

    if (!over) {
      return;
    }

    const activeType = active.data.current?.type;

    const overType = over.data.current?.type;

    /**
     * ==========================================
     * REORDER COLUMNS
     * ==========================================
     */
    if (activeType === "column" && overType === "column") {
      const oldIndex = board.columns.findIndex((column) => column.id === active.id);

      const newIndex = board.columns.findIndex((column) => column.id === over.id);

      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
        return;
      }

      const reorderedColumns = arrayMove(board.columns, oldIndex, newIndex);

      reorderColumnsMutation.mutate(reorderedColumns.map((column) => column.id));

      return;
    }

    /**
     * ==========================================
     * MOVE TASK
     * ==========================================
     */
    if (activeType !== "task") {
      return;
    }

    const activeColumnId = active.data.current?.columnId as string | undefined;

    if (!activeColumnId) {
      return;
    }

    const move = getTaskMove(
      board,
      { id: String(active.id), columnId: activeColumnId },
      {
        id: String(over.id),
        type: overType,
        columnId: over.data.current?.columnId as string | undefined,
      },
    );
    if (move) moveTaskMutation.mutate(move);
  };

  return (
    <>
      <div className="shrink-0 flex items-center gap-1 rounded-xl border bg-muted/40 p-1 w-fit">
        <button
          type="button"
          onClick={() => setTaskViewMode("active")}
          className={cn(
            "rounded-lg px-3 py-1.5",
            "text-sm font-medium",
            "transition-colors",
            taskViewMode === "active"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Активные
        </button>

        <button
          type="button"
          onClick={() => setTaskViewMode("completed")}
          className={cn(
            "rounded-lg px-3 py-1.5",
            "text-sm font-medium",
            "transition-colors",
            taskViewMode === "completed"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Выполненные
        </button>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragCancel={() => setActiveTask(null)}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={board.columns.map((column) => column.id)}
          strategy={horizontalListSortingStrategy}
        >
          <div className="flex min-h-0 flex-1 items-start gap-3 overflow-auto overscroll-contain pb-4 sm:gap-4">
            {board.columns.map((column) => (
              <ColumnCard
                key={column.id}
                column={column}
                tasks={filterTasks(column.tasks)}
                currentUserId={currentUserId}
                partnerId={partnerId}
                partnerName={partnerName}
                partnerAvatarUrl={partnerAvatarUrl}
                onCreateTask={() => onCreateTask(column.id)}
                onEditTask={onEditTask}
              />
            ))}

            <div className="w-[min(82vw,320px)] shrink-0">
              {isAdding ? (
                <div className="bg-card border rounded-3xl p-4 space-y-3">
                  <input
                    type="text"
                    value={newColumnTitle}
                    onChange={(event) => setNewColumnTitle(event.target.value)}
                    placeholder="Название колонки"
                    className={cn(
                      "w-full h-10 rounded-xl border bg-background px-3",
                      "text-sm outline-none focus:border-primary",
                    )}
                    autoFocus
                    onKeyDown={(event) => {
                      if (
                        event.key === "Enter" &&
                        newColumnTitle.trim() &&
                        !createColumnMutation.isPending
                      ) {
                        createColumnMutation.mutate({
                          title: newColumnTitle.trim(),
                        });
                      }

                      if (event.key === "Escape") {
                        setNewColumnTitle("");
                        setIsAdding(false);
                      }
                    }}
                  />

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      disabled={!newColumnTitle.trim() || createColumnMutation.isPending}
                      loading={createColumnMutation.isPending}
                      onClick={() => {
                        const title = newColumnTitle.trim();

                        if (!title) {
                          return;
                        }

                        createColumnMutation.mutate({
                          title,
                        });
                      }}
                    >
                      Создать
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={createColumnMutation.isPending}
                      onClick={() => {
                        setNewColumnTitle("");
                        setIsAdding(false);
                      }}
                    >
                      Отмена
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAdding(true)}
                  className={cn(
                    "w-full h-14 rounded-3xl border-2 border-dashed",
                    "border-border flex items-center justify-center",
                    "gap-2 text-sm font-medium text-muted-foreground",
                    "hover:border-primary hover:text-primary",
                    "transition-colors",
                  )}
                >
                  <Plus className="w-4 h-4" />
                  Новая колонка
                </button>
              )}
            </div>
          </div>
        </SortableContext>

        <DragOverlay>
          {activeTask ? (
            <TaskCard
              task={activeTask}
              currentUserId={currentUserId}
              partnerId={partnerId}
              partnerName={partnerName}
              partnerAvatarUrl={partnerAvatarUrl}
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </>
  );
}
