import type { ChatMessageItem } from "../type/chat";

const statusRank = {
  error: 0,
  sending: 1,
  sent: 2,
  delivered: 3,
  read: 4,
} as const;

export function getMessageStatus(message: {
  deliveredAt?: string | null;
  readAt?: string | null;
}): ChatMessageItem["status"] {
  return message.readAt ? "read" : message.deliveredAt ? "delivered" : "sent";
}

export function mergeMessages(
  current: ChatMessageItem[],
  incoming: ChatMessageItem[],
): ChatMessageItem[] {
  const byId = new Map(current.map((message) => [message.id, message]));

  for (const next of incoming) {
    const optimistic = next.clientId
      ? current.find((message) => message.clientId === next.clientId)
      : undefined;
    const previous = byId.get(next.id) ?? optimistic;
    if (optimistic && optimistic.id !== next.id) byId.delete(optimistic.id);

    const previousStatus = previous?.status;
    const status =
      previousStatus && statusRank[previousStatus] > statusRank[next.status]
        ? previousStatus
        : next.status;
    byId.set(next.id, { ...previous, ...next, status });
  }

  return [...byId.values()].sort(
    (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
  );
}
