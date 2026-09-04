"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Plus } from "lucide-react";

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

export function TogetherPage() {
  const [filter, setFilter] = useState<TaskFilter>("all");
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
  });

  const partnerName = user?.relationship?.partner?.firstName;
  const partnerAvatarUrl = user?.relationship?.partner?.avatarUrl;

  return (
    <div className="min-h-screen bg-background pb-8">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border/60 px-4 pt-safe-top">
        <div className="flex items-center justify-between py-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Together</h1>
            <p className="text-xs text-muted-foreground capitalize mt-0.5">
              {format(new Date(), "EEEE, d MMMM", { locale: ru })}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full"
              onClick={() => setIsTemplateOpen(true)}
            >
              Шаблоны
            </Button>
            <Button
              variant="primary"
              size="md"
              iconOnly
              className="rounded-full"
              onClick={() => setIsCreateOpen(true)}
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="px-4 pt-4">
        <div className="space-y-4">
          <TaskFilters active={filter} onChange={setFilter} />
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
              partnerId={relationship?.id}
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
      />

      <EditTaskSheet
        open={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setEditingTask(null);
        }}
        task={editingTask}
        columns={board?.columns ?? []}
      />

      <TemplatePicker
        open={isTemplateOpen}
        onClose={() => setIsTemplateOpen(false)}
        columns={board?.columns ?? []}
      />
    </div>
  );
}
