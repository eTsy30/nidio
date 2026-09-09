"use client";

import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove, horizontalListSortingStrategy, SortableContext } from "@dnd-kit/sortable";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { isBefore, startOfDay } from "date-fns";
import { Plus } from "lucide-react";

import { boardApi } from "@/features/together/api/board.api";
import { togetherKeys } from "@/features/together/api/query-keys";
import { tasksApi } from "@/features/together/api/tasks.api";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui";

import type { Board } from "../api/board.api";
import type { TaskFilter, TogetherTask } from "../model/task.types";

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

function isTaskOverdue(task: TogetherTask): boolean {
  if (task.completed || !task.dueAt) {
    return false;
  }

  return isBefore(startOfDay(new Date(task.dueAt)), startOfDay(new Date()));
}

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

  /**
   * Перемещение задачи.
   *
   * Optimistic update:
   * - сразу меняем React Query cache;
   * - если API упал — возвращаем предыдущий cache;
   * - после запроса синхронизируем board.
   */
  const moveTaskMutation = useMutation({
    retry: false,
    mutationFn: ({
      taskId,
      columnId,
      order,
    }: {
      taskId: string;
      columnId: string;
      order: number;
    }) => tasksApi.move(taskId, columnId, order),

    onMutate: async ({ taskId, columnId, order }) => {
      await queryClient.cancelQueries({
        queryKey: togetherKeys.board(),
      });

      const previousBoard = queryClient.getQueryData<Board>(togetherKeys.board());

      if (!previousBoard) {
        return { previousBoard };
      }

      const nextColumns = previousBoard.columns.map((column) => ({
        ...column,
        tasks: [...column.tasks],
      }));

      let movedTask: TogetherTask | undefined;

      let sourceColumnId: string | undefined;

      for (const column of nextColumns) {
        const index = column.tasks.findIndex((task) => task.id === taskId);

        if (index !== -1) {
          movedTask = column.tasks[index];

          sourceColumnId = column.id;

          column.tasks.splice(index, 1);

          break;
        }
      }

      if (!movedTask || !sourceColumnId) {
        return { previousBoard };
      }

      const updatedTask: TogetherTask = {
        ...movedTask,
        columnId,
      };

      const targetColumn = nextColumns.find((column) => column.id === columnId);

      if (!targetColumn) {
        return { previousBoard };
      }

      const safeOrder = Math.max(0, Math.min(order, targetColumn.tasks.length));

      targetColumn.tasks.splice(safeOrder, 0, updatedTask);

      queryClient.setQueryData<Board>(togetherKeys.board(), {
        ...previousBoard,
        columns: nextColumns,
      });

      return {
        previousBoard,
      };
    },

    onError: (_error, _variables, context) => {
      if (context?.previousBoard) {
        queryClient.setQueryData(togetherKeys.board(), context.previousBoard);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: togetherKeys.all,
      });
    },
  });

  /**
   * Перемещение колонок.
   */
  const reorderColumnsMutation = useMutation({
    retry: false,
    mutationFn: boardApi.reorderColumns,

    onMutate: async (orderedIds) => {
      await queryClient.cancelQueries({
        queryKey: togetherKeys.board(),
      });

      const previousBoard = queryClient.getQueryData<Board>(togetherKeys.board());

      queryClient.setQueryData<Board>(togetherKeys.board(), (old) => {
        if (!old) {
          return old;
        }

        const idToCol = new Map(old.columns.map((column) => [column.id, column]));

        const newColumns = orderedIds
          .map((id) => idToCol.get(id))
          .filter(Boolean) as typeof old.columns;

        return {
          ...old,
          columns: newColumns,
        };
      });

      return { previousBoard };
    },

    onError: (_error, _ids, context) => {
      if (context?.previousBoard) {
        queryClient.setQueryData(togetherKeys.board(), context.previousBoard);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: togetherKeys.all,
      });
    },
  });

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

    const taskId = String(active.id);

    const activeColumnId = active.data.current?.columnId as string | undefined;

    if (!activeColumnId) {
      return;
    }

    /**
     * Drop в колонку.
     */
    if (overType === "column") {
      const targetColumnId = over.data.current?.columnId as string | undefined;

      if (!targetColumnId) {
        return;
      }

      const targetColumn = board.columns.find((column) => column.id === targetColumnId);

      if (!targetColumn) {
        return;
      }

      /**
       * Если бросили в ту же колонку,
       * добавляем в конец.
       */
      const targetOrder =
        targetColumnId === activeColumnId
          ? Math.max(0, targetColumn.tasks.length - 1)
          : targetColumn.tasks.length;

      moveTaskMutation.mutate({
        taskId,
        columnId: targetColumnId,
        order: targetOrder,
      });

      return;
    }

    /**
     * Drop на другую задачу.
     */
    if (overType === "task") {
      const targetColumnId = over.data.current?.columnId as string | undefined;

      if (!targetColumnId) {
        return;
      }

      const targetColumn = board.columns.find((column) => column.id === targetColumnId);

      if (!targetColumn) {
        return;
      }

      const activeIndex = targetColumn.tasks.findIndex((task) => task.id === taskId);

      const targetIndex = targetColumn.tasks.findIndex((task) => task.id === over.id);

      if (targetIndex === -1) {
        return;
      }

      let targetOrder = targetIndex;

      /**
       * Если таска двигается внутри той же
       * колонки вниз, после удаления
       * исходной позиции индекс назначения
       * уменьшается на 1.
       */
      if (targetColumnId === activeColumnId && activeIndex !== -1 && activeIndex < targetIndex) {
        targetOrder -= 1;
      }

      targetOrder = Math.max(0, targetOrder);

      /**
       * Если задача уже находится перед target,
       * ничего менять не нужно.
       */
      if (targetColumnId === activeColumnId && activeIndex === targetIndex) {
        return;
      }

      moveTaskMutation.mutate({
        taskId,
        columnId: targetColumnId,
        order: targetOrder,
      });
    }
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

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
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
