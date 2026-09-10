import { getAccessToken, removeAccessToken, setAccessToken } from "@/shared/lib/token";

import { apiConfig } from "../config/api.config";

export type SessionRefreshFailure = "expired" | "unavailable";

export class SessionRefreshError extends Error {
  constructor(public readonly reason: SessionRefreshFailure) {
    super(reason === "expired" ? "Session expired" : "Session refresh is unavailable");
    this.name = "SessionRefreshError";
  }
}

type RefreshResponse = {
  accessToken?: unknown;
};

const expiredListeners = new Set<() => void>();
const SESSION_CHANNEL = "nidio-session";
const SESSION_LOCK = "nidio-session-refresh";
const SHARED_REFRESH_WINDOW_MS = 5_000;

let refreshPromise: Promise<string> | null = null;
let sessionChannel: BroadcastChannel | null = null;
let latestSharedRefreshAt = 0;

function notifySessionExpired(): void {
  expiredListeners.forEach((listener) => listener());
}

function ensureSessionChannel(): BroadcastChannel | null {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") {
    return null;
  }

  if (!sessionChannel) {
    sessionChannel = new BroadcastChannel(SESSION_CHANNEL);
    sessionChannel.addEventListener("message", (event: MessageEvent<unknown>) => {
      const message = event.data;
      if (!message || typeof message !== "object") return;

      const payload = message as { type?: unknown; token?: unknown; refreshedAt?: unknown };
      if (payload.type === "refreshed" && typeof payload.token === "string") {
        latestSharedRefreshAt =
          typeof payload.refreshedAt === "number" ? payload.refreshedAt : Date.now();
        setAccessToken(payload.token);
      }

      if (payload.type === "ended") {
        removeAccessToken();
        notifySessionExpired();
      }
    });
  }

  return sessionChannel;
}

function endSession(broadcast: boolean): void {
  removeAccessToken();
  notifySessionExpired();
  if (broadcast) ensureSessionChannel()?.postMessage({ type: "ended" });
}

function expireSession(): never {
  endSession(true);
  throw new SessionRefreshError("expired");
}

function getRecentlySharedToken(): string | null {
  if (Date.now() - latestSharedRefreshAt > SHARED_REFRESH_WINDOW_MS) {
    return null;
  }

  return getAccessToken();
}

async function withRefreshLock<T>(callback: () => Promise<T>): Promise<T> {
  if (typeof navigator === "undefined" || !navigator.locks) {
    return callback();
  }

  return navigator.locks.request(SESSION_LOCK, { mode: "exclusive" }, callback);
}

async function requestRefresh(): Promise<string> {
  let response: Response;

  try {
    response = await fetch(`${apiConfig.baseURL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch {
    throw new SessionRefreshError("unavailable");
  }

  if (response.status === 401 || response.status === 403) {
    return expireSession();
  }

  if (!response.ok) {
    throw new SessionRefreshError("unavailable");
  }

  let body: RefreshResponse;
  try {
    body = (await response.json()) as RefreshResponse;
  } catch {
    return expireSession();
  }

  if (typeof body.accessToken !== "string" || body.accessToken.length === 0) {
    return expireSession();
  }

  setAccessToken(body.accessToken);
  return body.accessToken;
}

export function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = withRefreshLock(async () => {
      const sharedToken = getRecentlySharedToken();
      if (sharedToken) return sharedToken;

      const token = await requestRefresh();
      latestSharedRefreshAt = Date.now();
      ensureSessionChannel()?.postMessage({
        type: "refreshed",
        token,
        refreshedAt: latestSharedRefreshAt,
      });
      return token;
    }).finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

export function subscribeSessionExpired(listener: () => void): () => void {
  ensureSessionChannel();
  expiredListeners.add(listener);
  return () => {
    expiredListeners.delete(listener);
  };
}

export function endCurrentSession(): void {
  endSession(true);
}

export function isSessionRefreshError(
  error: unknown,
  reason?: SessionRefreshFailure,
): error is SessionRefreshError {
  return error instanceof SessionRefreshError && (reason === undefined || error.reason === reason);
}
