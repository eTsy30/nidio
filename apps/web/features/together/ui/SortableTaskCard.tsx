"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { isTaskOverdue } from "../lib/task-utils";
import { TogetherTask } from "../model/task.types";

import { TaskCard } from "./TaskCard";

interface SortableTaskCardProps {
  task: TogetherTask;
  currentUserId: string;
  partnerId?: string | undefined;
  partnerName?: string | undefined;
  partnerAvatarUrl?: string | null | undefined;
  onEdit?: ((task: TogetherTask) => void) | undefined;
}

export function SortableTaskCard(props: SortableTaskCardProps) {
  const disabled = props.task.completed || isTaskOverdue(props.task);

  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: props.task.id,
    disabled,
    data: {
      type: "task",
      columnId: props.task.columnId,
      task: props.task,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...(disabled ? {} : listeners)}>
      <TaskCard {...props} />
    </div>
  );
}
