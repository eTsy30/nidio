import type { NormalizedCacheObject } from "@apollo/client";
import { dehydrate, type DehydratedState, hydrate, type QueryClient } from "@tanstack/react-query";

import type { User } from "@/shared/contracts/user";

const STORAGE_KEY = "nidio:offline:v1";
const LOGOUT_KEY = "nidio:logout-pending";
const MAX_AGE = 30 * 24 * 60 * 60 * 1000;
const MAX_SIZE = 2_000_000;

let failedSnapshotUserId: string | null = null;
const persistenceListeners = new Set<() => void>();

export function getSnapshotFailure(): string | null {
  return failedSnapshotUserId;
}

export function subscribeSnapshotFailure(listener: () => void): () => void {
  persistenceListeners.add(listener);
  return () => {
    persistenceListeners.delete(listener);
  };
}

function reportSnapshotFailure(userId: string | null): void {
  if (failedSnapshotUserId === userId) return;
  failedSnapshotUserId = userId;
  persistenceListeners.forEach((listener) => listener());
}

type Snapshot = {
  version: 1;
  savedAt: number;
  userId: string;
  queries: DehydratedState;
  calendar: NormalizedCacheObject;
};

type CalendarCache = {
  extract: () => unknown;
  restore: (data: NormalizedCacheObject) => unknown;
};

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

// An explicit allowlist excludes invite links, credentials and arbitrary API responses.
export function canPersistQuery(key: readonly unknown[]): boolean {
  return (
    (key[0] === "auth" && key[1] === "user" && key.length === 2) ||
    (key[0] === "relationship" && key[1] === "couple" && key.length === 2) ||
    key[0] === "together" ||
    key[0] === "savings" ||
    key[0] === "loyalty-cards"
  );
}

export function clearOfflineSnapshot(): void {
  reportSnapshotFailure(null);
  try {
    storage()?.removeItem(STORAGE_KEY);
  } catch {
    /* Storage may be disabled. */
  }
}

export function setLogoutPending(pending: boolean): void {
  try {
    if (pending) storage()?.setItem(LOGOUT_KEY, "1");
    else storage()?.removeItem(LOGOUT_KEY);
  } catch {
    /* The in-memory session is still cleared. */
  }
}

export function isLogoutPending(): boolean {
  try {
    return storage()?.getItem(LOGOUT_KEY) === "1";
  } catch {
    return false;
  }
}

function readSnapshot(): Snapshot | null {
  if (isLogoutPending()) return null;
  try {
    const raw = storage()?.getItem(STORAGE_KEY);
    if (!raw || raw.length > MAX_SIZE) return null;
    const saved = JSON.parse(raw) as Snapshot;
    if (
      saved.version !== 1 ||
      typeof saved.userId !== "string" ||
      !Number.isFinite(saved.savedAt) ||
      saved.savedAt > Date.now() ||
      Date.now() - saved.savedAt > MAX_AGE ||
      !Array.isArray(saved.queries?.queries) ||
      !saved.calendar ||
      typeof saved.calendar !== "object"
    )
      return null;
    const user = saved.queries.queries.find(
      (q) => q.queryKey[0] === "auth" && q.queryKey[1] === "user",
    )?.state.data as User | undefined;
    if (!user || user.id !== saved.userId) return null;
    return saved;
  } catch {
    return null;
  }
}

export function restoreOfflineSnapshot(client: QueryClient, calendar: CalendarCache): User | null {
  const saved = readSnapshot();
  if (!saved) return null;
  try {
    hydrate(client, {
      mutations: [],
      queries: saved.queries.queries.filter((q) => canPersistQuery(q.queryKey)),
    });
    calendar.restore(saved.calendar);
    return client.getQueryData<User>(["auth", "user"]) ?? null;
  } catch {
    clearOfflineSnapshot();
    return null;
  }
}

export function saveOfflineSnapshot(
  client: QueryClient,
  calendar: CalendarCache,
  userId: string,
): boolean {
  if (isLogoutPending()) return false;
  const user = client.getQueryData<User>(["auth", "user"]);
  if (!user || user.id !== userId) return false;
  let saved = false;
  try {
    const target = storage();
    if (!target) return false;
    const extracted = calendar.extract();
    if (!extracted || typeof extracted !== "object" || Array.isArray(extracted)) return false;
    const snapshot: Snapshot = {
      version: 1,
      savedAt: Date.now(),
      userId,
      queries: dehydrate(client, {
        shouldDehydrateMutation: () => false,
        shouldDehydrateQuery: (q) => q.state.data !== undefined && canPersistQuery(q.queryKey),
      }),
      calendar: extracted as NormalizedCacheObject,
    };
    // A failed background refresh must not discard the last successful data on reload.
    snapshot.queries.queries = snapshot.queries.queries.map((query) => ({
      ...query,
      state: {
        ...query.state,
        status: "success",
        error: null,
        fetchFailureReason: null,
        fetchStatus: "idle",
      },
    }));
    const raw = JSON.stringify(snapshot);
    if (raw.length > MAX_SIZE) return false;
    target.setItem(STORAGE_KEY, raw);
    saved = true;
    return true;
  } catch {
    return false;
  } finally {
    reportSnapshotFailure(saved ? null : userId);
  }
}

export function savedOfflineUserId(): string | null {
  return readSnapshot()?.userId ?? null;
}
