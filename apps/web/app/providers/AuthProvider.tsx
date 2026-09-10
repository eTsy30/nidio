"use client";

import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { logout as logoutApi, me } from "@/features/auth/api/auth.api";
import { disablePush } from "@/features/push/push-client";
import { http } from "@/shared/api/client/api";
import { AuthContext } from "@/shared/api/provider/auth-context";
import { queryKeys } from "@/shared/api/query/query-keys";
import {
  isSessionRefreshError,
  refreshAccessToken,
  subscribeSessionExpired,
} from "@/shared/api/session/session-coordinator";
import { apolloClient } from "@/shared/lib/apollo-client";
import { getAccessToken, subscribeAuth } from "@/shared/lib/token";
import { routes } from "@/shared/router/paths";

type SessionState = "bootstrapping" | "authenticated" | "anonymous";

const REFRESH_INTERVAL_MS = 1000 * 60 * 10;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sessionState, setSessionState] = useState<SessionState>("bootstrapping");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bootstrapRef = useRef(true);
  const profileRequestRef = useRef<Promise<void> | null>(null);
  const queryClient = useQueryClient();
  const { data: user } = useQuery({
    queryKey: queryKeys.auth.user,
    queryFn: me,
    enabled: false,
    retry: false,
  });

  const clearUser = useCallback(() => {
    queryClient.removeQueries({ queryKey: queryKeys.auth.user });
    setSessionState("anonymous");
  }, [queryClient]);

  const clearApplicationSession = useCallback(() => {
    queryClient.clear();
    void apolloClient.clearStore().catch(() => undefined);
    setSessionState("anonymous");
  }, [queryClient]);

  const redirectToLogin = useCallback(() => {
    if (typeof window === "undefined" || window.location.pathname === routes.login) return;
    const redirect = `${window.location.pathname}${window.location.search}`;
    window.location.replace(`${routes.login}?redirect=${encodeURIComponent(redirect)}`);
  }, []);

  const refreshUser = useCallback(async (): Promise<void> => {
    if (profileRequestRef.current) return profileRequestRef.current;
    const request = queryClient
      .fetchQuery({ queryKey: queryKeys.auth.user, queryFn: me, staleTime: 0 })
      .then(() => setSessionState("authenticated"))
      .catch((error: unknown) => {
        if (!getAccessToken() || isSessionRefreshError(error, "expired")) {
          clearUser();
          return;
        }
        setSessionState("authenticated");
      })
      .finally(() => {
        profileRequestRef.current = null;
      });
    profileRequestRef.current = request;
    return request;
  }, [clearUser, queryClient]);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await disablePush().catch(() => undefined);
      await logoutApi();
    } finally {
      clearApplicationSession();
      redirectToLogin();
    }
  }, [clearApplicationSession, redirectToLogin]);

  useEffect(
    () =>
      subscribeAuth(() => {
        if (getAccessToken()) {
          setSessionState("authenticated");
          void refreshUser();
          return;
        }
        clearUser();
      }),
    [clearUser, refreshUser],
  );

  useEffect(
    () =>
      subscribeSessionExpired(() => {
        clearApplicationSession();
        if (!bootstrapRef.current) redirectToLogin();
      }),
    [clearApplicationSession, redirectToLogin],
  );

  useEffect(() => {
    const bootstrap = async (): Promise<void> => {
      if (getAccessToken()) {
        setSessionState("authenticated");
        await refreshUser();
      } else {
        try {
          await refreshAccessToken();
          await refreshUser();
        } catch (error) {
          if (isSessionRefreshError(error, "expired")) clearUser();
          else setSessionState("anonymous");
        }
      }
      bootstrapRef.current = false;
      setSessionState((state) => (state === "bootstrapping" ? "anonymous" : state));
    };
    void bootstrap();
  }, [clearUser, refreshUser]);

  useEffect(() => {
    if (sessionState !== "authenticated") {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      return;
    }
    intervalRef.current = setInterval(
      () => void refreshAccessToken().catch(() => undefined),
      REFRESH_INTERVAL_MS,
    );
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [sessionState]);

  useEffect(() => {
    if (!user?.id) return;
    const syncTimeZone = () => {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      void http.post("/push/timezone", { timeZone }).catch(() => undefined);
    };
    syncTimeZone();
    window.addEventListener("focus", syncTimeZone);
    return () => window.removeEventListener("focus", syncTimeZone);
  }, [user?.id]);

  return (
    <AuthContext.Provider
      value={{
        isLoading: sessionState === "bootstrapping",
        isAuthenticated: sessionState === "authenticated",
        user: user ?? null,
        refreshUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
