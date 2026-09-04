import { TogetherTask } from "../model/task.types";

import { TaskItem } from "./TaskItem";

interface TaskSectionProps {
  title: string;
  tasks: TogetherTask[];
  currentUserId: string;
  partnerName?: string | undefined;
  onToggle: (id: string) => void;
  togglingId: string | null;
}

export function TaskSection({
  title,
  tasks,
  currentUserId,
  partnerName,
  onToggle,
  togglingId,
}: TaskSectionProps) {
  if (tasks.length === 0) return null;

  return (
    <section className="space-y-3">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
        {title} · {tasks.length}
      </h3>
      <div className="space-y-3">
        {tasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            currentUserId={currentUserId}
            partnerName={partnerName}
            onToggle={onToggle}
            disabled={togglingId === task.id}
          />
        ))}
      </div>
    </section>
  );
}
