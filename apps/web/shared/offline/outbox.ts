/** Durable, account-scoped operations. Only idempotent commands may enter this queue. */
export type SavingsSaveOperation = {
  version: 1;
  kind: "savings.save";
  userId: string;
  coupleId: string;
  goalId: string;
  installmentId: string;
  createdAt: string;
  status: "pending" | "failed";
  error?: string;
};
export type OutboxOperation = SavingsSaveOperation;
const PREFIX = "nidio:outbox:v1:";
const MAX_OPERATIONS = 500;
const listeners = new Set<() => void>();
let revision = 0;

function storage(): Storage {
  if (typeof window === "undefined") throw new Error("Хранилище устройства недоступно");
  return window.localStorage;
}
function key(operation: OutboxOperation): string {
  return (
    PREFIX +
    [
      operation.userId,
      operation.coupleId,
      operation.kind,
      operation.goalId,
      operation.installmentId,
    ]
      .map(encodeURIComponent)
      .join(":")
  );
}
function notify(): void {
  revision++;
  listeners.forEach((listener) => listener());
}
function onStorage(event: StorageEvent): void {
  if (event.key === null || event.key.startsWith(PREFIX)) notify();
}
export function subscribeOutbox(listener: () => void): () => void {
  if (!listeners.size) window.addEventListener("storage", onStorage);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (!listeners.size) window.removeEventListener("storage", onStorage);
  };
}
export const outboxRevision = () => revision;

function valid(value: unknown): value is OutboxOperation {
  if (!value || typeof value !== "object") return false;
  const o = value as OutboxOperation;
  return (
    o.version === 1 &&
    o.kind === "savings.save" &&
    [o.userId, o.coupleId, o.goalId, o.installmentId].every(
      (v) => typeof v === "string" && v.length > 0 && v.length <= 200,
    ) &&
    typeof o.createdAt === "string" &&
    Number.isFinite(Date.parse(o.createdAt)) &&
    (o.status === "pending" || o.status === "failed")
  );
}
export function listOutbox(userId: string): OutboxOperation[] {
  const store = storage();
  const result: OutboxOperation[] = [];
  for (let i = 0; i < store.length; i++) {
    const name = store.key(i);
    if (!name?.startsWith(PREFIX)) continue;
    try {
      const item: unknown = JSON.parse(store.getItem(name) ?? "null");
      if (valid(item) && item.userId === userId && key(item) === name) result.push(item);
    } catch {
      /* Ignore an invalid entry without blocking valid operations. */
    }
  }
  return result.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}
export function queueSavingsSave(
  input: Pick<SavingsSaveOperation, "userId" | "coupleId" | "goalId" | "installmentId">,
): OutboxOperation {
  const operation: OutboxOperation = {
    ...input,
    version: 1,
    kind: "savings.save",
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  if (!valid(operation)) throw new Error("Не удалось определить взнос для сохранения");
  const store = storage();
  const existing = listOutbox(input.userId).find((item) => key(item) === key(operation));
  if (existing?.status === "pending") return existing;
  if (!existing && listOutbox(input.userId).length >= MAX_OPERATIONS)
    throw new Error("Сначала подключитесь к интернету и отправьте накопившиеся изменения");
  try {
    store.setItem(key(operation), JSON.stringify(operation));
  } catch {
    throw new Error("Не удалось сохранить на устройстве. Освободите место и повторите попытку.");
  }
  notify();
  return operation;
}
export function removeOutbox(operation: OutboxOperation): void {
  storage().removeItem(key(operation));
  notify();
}
export function failOutbox(operation: OutboxOperation, error: string): void {
  const store = storage();
  if (!store.getItem(key(operation))) return;
  store.setItem(key(operation), JSON.stringify({ ...operation, status: "failed", error }));
  notify();
}
export function clearOutbox(userId: string): void {
  const store = storage();
  // Remove even malformed entries belonging to this account.
  const prefix = PREFIX + encodeURIComponent(userId) + ":";
  const names = Array.from({ length: store.length }, (_, i) => store.key(i));
  names.forEach((name) => {
    if (name?.startsWith(prefix)) store.removeItem(name);
  });
  notify();
}
