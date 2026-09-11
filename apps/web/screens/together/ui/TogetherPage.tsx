"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

import { useCurrentCouple } from "@/features/relationship/hook/use-relationship";
import { boardApi } from "@/features/together/api/board.api";
import { togetherKeys } from "@/features/together/api/query-keys";
import { TaskFilter, TogetherTask } from "@/features/together/model/task.types";
import { BoardView } from "@/features/together/ui/BoardView";
import { CreateTaskSheet } from "@/features/together/ui/CreateTaskSheet";
import { EditTaskSheet } from "@/features/together/ui/EditTaskSheet";
import { TaskFilters } from "@/features/together/ui/TaskFilters";
import { TemplatePicker } from "@/features/together/ui/TemplatePicker";
import { useAuth } from "@/shared/api/provider/auth-provider";
import { Button } from "@/shared/ui/button/Button";

const TASK_FILTERS = new Set<TaskFilter>(["all", "me", "partner", "together", "rotate"]);

function getTaskFilter(value: string | null): TaskFilter {
  return value && TASK_FILTERS.has(value as TaskFilter) ? (value as TaskFilter) : "all";
}

export function TogetherPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filter = getTaskFilter(searchParams.get("filter"));
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isTemplateOpen, setIsTemplateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedColumnId, setSelectedColumnId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<TogetherTask | null>(null);

  const { user } = useAuth();
  const { data: relationship } = useCurrentCouple();

  const { data: board, isLoading: boardLoading } = useQuery({
    queryKey: togetherKeys.board(),
    queryFn: boardApi.getBoard,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
    refetchOnReconnect: "always",
  });

  const partnerName = relationship?.partnerFirstName ?? undefined;
  const partnerAvatarUrl = relationship?.partnerAvatarUrl ?? undefined;

  const handleFilterChange = (nextFilter: TaskFilter) => {
    const params = new URLSearchParams(searchParams.toString());
    if (nextFilter === "all") params.delete("filter");
    else params.set("filter", nextFilter);

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background">
      <header className="sticky top-0 z-10 bg-card/80 backdrop-blur-md border-b border-border/60 px-4 pt-safe-top">
        <div className="flex items-center justify-between py-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Совместные задачи</h1>
            <p className="text-xs text-muted-foreground capitalize mt-0.5">
              {format(new Date(), "EEEE, d MMMM", { locale: ru })}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="primary"
              size="sm"
              className="rounded-full"
              onClick={() => setIsTemplateOpen(true)}
            >
              Шаблоны
            </Button>
          </div>
        </div>
      </header>

      <main className="flex min-h-0 min-w-0 flex-1 flex-col px-3 pt-3 sm:px-6 lg:px-8">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
          <TaskFilters active={filter} onChange={handleFilterChange} />
          {boardLoading ? (
            <div className="flex gap-4 overflow-x-auto pb-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="w-72 shrink-0 h-96 rounded-3xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : board ? (
            <BoardView
              board={board}
              filter={filter}
              currentUserId={user?.id ?? ""}
              partnerId={relationship?.partnerId}
              partnerName={partnerName}
              partnerAvatarUrl={partnerAvatarUrl}
              onCreateTask={(columnId) => {
                setSelectedColumnId(columnId);
                setIsCreateOpen(true);
              }}
              onEditTask={(task) => {
                setEditingTask(task);
                setIsEditOpen(true);
              }}
            />
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-lg font-medium mb-1">Нет доски</p>
              <p className="text-sm">Создайте первую колонку, чтобы начать</p>
            </div>
          )}
        </div>
      </main>

      <CreateTaskSheet
        open={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setSelectedColumnId(null);
        }}
        defaultColumnId={selectedColumnId ?? undefined}
        columns={board?.columns ?? []}
        partnerId={relationship?.partnerId}
      />

      <EditTaskSheet
        open={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setEditingTask(null);
        }}
        task={editingTask}
        columns={board?.columns ?? []}
        partnerId={relationship?.partnerId}
      />

      <TemplatePicker open={isTemplateOpen} onClose={() => setIsTemplateOpen(false)} />
    </div>
  );
}
