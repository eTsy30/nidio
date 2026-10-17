import type { SavingsGoal } from "@/shared/contracts/savings";

import { failOutbox, listOutbox, type OutboxOperation, removeOutbox } from "./outbox";

export type OutboxTransport = {
  userId: string;
  /** Must re-check the current session before and after every request. */
  isCurrent: () => boolean;
  getCoupleId: () => Promise<string | null>;
  send: (operation: OutboxOperation) => Promise<SavingsGoal>;
  onConfirmed: (operation: OutboxOperation, result: SavingsGoal) => Promise<void>;
};
const running = new Map<string, Promise<void>>();
function statusOf(error: unknown): number | undefined {
  return (error as { response?: { status?: number } } | null)?.response?.status;
}
async function drain(transport: OutboxTransport): Promise<void> {
  if (!transport.isCurrent()) return;
  const coupleId = await transport.getCoupleId();
  for (const operation of listOutbox(transport.userId)) {
    if (!transport.isCurrent()) return;
    if (operation.status === "failed") continue;
    if (operation.coupleId !== coupleId) {
      failOutbox(operation, "Пара изменилась. Эта отметка не отправлена.");
      continue;
    }
    let result: SavingsGoal;
    try {
      result = await transport.send(operation);
    } catch (error) {
      if (!transport.isCurrent()) return;
      const status = statusOf(error);
      if (status && status >= 400 && status < 500 && ![401, 408, 429].includes(status)) {
        failOutbox(
          operation,
          status === 404
            ? "Копилка или взнос больше недоступны."
            : "Сервер отклонил отметку. Проверьте данные и повторите попытку.",
        );
        continue;
      }
      // A timeout may mean the server committed the change. Keep it for idempotent replay.
      return;
    }
    if (!transport.isCurrent()) return;
    // Persist fresh server data before removing the local record. A crash can safely replay it.
    await transport.onConfirmed(operation, result);
    if (!transport.isCurrent()) return;
    removeOutbox(operation);
  }
}
export function syncOutbox(transport: OutboxTransport): Promise<void> {
  const existing = running.get(transport.userId);
  if (existing) return existing;
  const work = async () => {
    if (typeof navigator !== "undefined" && navigator.locks) {
      await navigator.locks.request(`nidio:outbox:${transport.userId}`, () => drain(transport));
    } else {
      // Only idempotent operations are allowed, so replay from a second tab is safe.
      await drain(transport);
    }
  };
  const promise = work().finally(() => running.delete(transport.userId));
  running.set(transport.userId, promise);
  return promise;
}
