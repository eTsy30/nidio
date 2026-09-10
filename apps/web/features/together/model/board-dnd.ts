import type { Board } from "../api/board.api";

export type TaskMove = {
  taskId: string;
  columnId: string;
  order: number;
};

type DropTarget = {
  id: string;
  type?: string | undefined;
  columnId?: string | undefined;
};

/**
 * Translates DnD-kit data into the API move request. It has no side effects,
 * so the same rules are used by pointer, touch and keyboard dragging.
 */
export function getTaskMove(
  board: Board,
  active: { id: string; columnId: string },
  over: DropTarget,
): TaskMove | null {
  const sourceColumn = board.columns.find((column) => column.id === active.columnId);
  if (!sourceColumn) return null;

  const sourceIndex = sourceColumn.tasks.findIndex((task) => task.id === active.id);
  if (sourceIndex === -1) return null;

  const targetColumnId = over.columnId;
  if (!targetColumnId) return null;
  const targetColumn = board.columns.find((column) => column.id === targetColumnId);
  if (!targetColumn) return null;

  if (over.type === "column") {
    const order =
      targetColumnId === active.columnId
        ? Math.max(0, targetColumn.tasks.length - 1)
        : targetColumn.tasks.length;
    return { taskId: active.id, columnId: targetColumnId, order };
  }

  if (over.type !== "task") return null;
  const targetIndex = targetColumn.tasks.findIndex((task) => task.id === over.id);
  if (targetIndex === -1 || (targetColumnId === active.columnId && sourceIndex === targetIndex)) {
    return null;
  }

  const order =
    targetColumnId === active.columnId && sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
  return { taskId: active.id, columnId: targetColumnId, order: Math.max(0, order) };
}

/** Returns a new board for optimistic cache updates without mutating cached data. */
export function applyTaskMove(board: Board, move: TaskMove): Board {
  const columns = board.columns.map((column) => ({ ...column, tasks: [...column.tasks] }));
  const sourceColumn = columns.find((column) =>
    column.tasks.some((task) => task.id === move.taskId),
  );
  const targetColumn = columns.find((column) => column.id === move.columnId);
  if (!sourceColumn || !targetColumn) return board;

  const sourceIndex = sourceColumn.tasks.findIndex((task) => task.id === move.taskId);
  const task = sourceColumn.tasks[sourceIndex];
  if (!task) return board;

  sourceColumn.tasks.splice(sourceIndex, 1);
  targetColumn.tasks.splice(Math.max(0, Math.min(move.order, targetColumn.tasks.length)), 0, {
    ...task,
    columnId: move.columnId,
  });
  return { ...board, columns };
}
