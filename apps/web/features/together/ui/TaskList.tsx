"use client";

import { TaskFilter, TogetherTask } from "../model/task.types";

import { TaskSection } from "./TaskSection";

interface TaskListProps {
  tasks: TogetherTask[];
  filter: TaskFilter;
  currentUserId: string;
  partnerId?: string | undefined;
  partnerName?: string | undefined;
  onToggle: (id: string) => void;
  togglingId: string | null;
}

export function TaskList({
  tasks,
  filter,
  currentUserId,
  partnerId,
  partnerName,
  onToggle,
  togglingId,
}: TaskListProps) {
  const filtered = tasks.filter((t) => {
    if (filter === "all") return true;
    if (filter === "me") return t.assigneeMode === "ME" && t.assigneeId === currentUserId;
    if (filter === "partner") return t.assigneeMode === "PARTNER" && t.assigneeId === partnerId;
    if (filter === "together") return t.assigneeMode === "BOTH";
    if (filter === "rotate") return t.assigneeMode === "ROTATE";
    return true;
  });

  const mine = filtered.filter((t) => t.assigneeMode === "ME");
  const partner = filtered.filter((t) => t.assigneeMode === "PARTNER");
  const together = filtered.filter((t) => t.assigneeMode === "BOTH");
  const rotate = filtered.filter((t) => t.assigneeMode === "ROTATE");

  return (
    <div className="space-y-6">
      <TaskSection
        title="Мне"
        tasks={mine}
        currentUserId={currentUserId}
        partnerName={partnerName}
        onToggle={onToggle}
        togglingId={togglingId}
      />
      <TaskSection
        title="Партнёру"
        tasks={partner}
        currentUserId={currentUserId}
        partnerName={partnerName}
        onToggle={onToggle}
        togglingId={togglingId}
      />
      <TaskSection
        title="Вместе"
        tasks={together}
        currentUserId={currentUserId}
        partnerName={partnerName}
        onToggle={onToggle}
        togglingId={togglingId}
      />
      <TaskSection
        title="По очереди"
        tasks={rotate}
        currentUserId={currentUserId}
        partnerName={partnerName}
        onToggle={onToggle}
        togglingId={togglingId}
      />

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground text-sm">Нет задач</div>
      )}
    </div>
  );
}
