import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { Board } from "../api/board.api";
import { boardApi } from "../api/board.api";
import { togetherKeys } from "../api/query-keys";
import { tasksApi } from "../api/tasks.api";

import { applyTaskMove } from "./board-dnd";

export function useBoardMutations() {
  const queryClient = useQueryClient();

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
      await queryClient.cancelQueries({ queryKey: togetherKeys.board() });
      const previousBoard = queryClient.getQueryData<Board>(togetherKeys.board());
      if (!previousBoard) return { previousBoard };

      queryClient.setQueryData<Board>(
        togetherKeys.board(),
        applyTaskMove(previousBoard, { taskId, columnId, order }),
      );
      return { previousBoard };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousBoard) {
        queryClient.setQueryData(togetherKeys.board(), context.previousBoard);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: togetherKeys.all });
    },
  });

  const reorderColumnsMutation = useMutation({
    retry: false,
    mutationFn: boardApi.reorderColumns,
    onMutate: async (orderedIds) => {
      await queryClient.cancelQueries({ queryKey: togetherKeys.board() });
      const previousBoard = queryClient.getQueryData<Board>(togetherKeys.board());
      queryClient.setQueryData<Board>(togetherKeys.board(), (board) => {
        if (!board) return board;
        const columnsById = new Map(board.columns.map((column) => [column.id, column]));
        return {
          ...board,
          columns: orderedIds.flatMap((id) => {
            const column = columnsById.get(id);
            return column ? [column] : [];
          }),
        };
      });
      return { previousBoard };
    },
    onError: (_error, _orderedIds, context) => {
      if (context?.previousBoard) {
        queryClient.setQueryData(togetherKeys.board(), context.previousBoard);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: togetherKeys.all });
    },
  });

  return { moveTaskMutation, reorderColumnsMutation };
}
