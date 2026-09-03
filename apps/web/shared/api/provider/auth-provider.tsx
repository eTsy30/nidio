"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { User } from "@/features/auth/model/auth.types";
import { http } from "@/shared/api/client/api";
import {
  getAccessToken,
  removeAccessToken,
  setAccessToken,
  subscribeAuth,
} from "@/shared/lib/token";

type AuthContextValue = {
  isLoading: boolean;
  user: User | null;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  isLoading: true,
  user: null,
  refreshUser: async () => {},
  logout: async () => {},
});

const REFRESH_INTERVAL_MS = 1000 * 60 * 10; // 10 минут

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const doRefresh = useCallback(async (): Promise<boolean> => {
    try {
      const response = await http.post<{ accessToken: string }>("/auth/refresh");

      if (response.accessToken) {
        setAccessToken(response.accessToken);
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }, []);

  const refreshUser = useCallback(async (): Promise<void> => {
    try {
      const me = await http.get<User>("/auth/@me");
      setUser(me);
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } })?.response?.status;

      if (status === 401) {
        const refreshed = await doRefresh();

        if (refreshed) {
          try {
            const me = await http.get<User>("/auth/@me");
            setUser(me);
            return;
          } catch {
            // fall through to cleanup
          }
        }
      }

      removeAccessToken();
      setUser(null);
    }
  }, [doRefresh]);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await http.post("/auth/logout");
    } catch {
      // ignore
    } finally {
      removeAccessToken();
      setUser(null);
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
  }, []);

  useEffect(() => {
    const bootstrap = async (): Promise<void> => {
      const hasToken = !!getAccessToken();

      if (hasToken) {
        await refreshUser();
        setIsLoading(false);
        return;
      }

      const refreshed = await doRefresh();

      if (refreshed) {
        await refreshUser();
      } else {
        removeAccessToken();
        setUser(null);
      }

      setIsLoading(false);
    };

    void bootstrap();
  }, [refreshUser, doRefresh]);

  useEffect(() => {
    const unsubscribe = subscribeAuth(() => {
      if (getAccessToken()) {
        void refreshUser();
      } else {
        setUser(null);
      }
    });

    return unsubscribe;
  }, [refreshUser]);

  // Периодически обновляем токен, чтобы он не истекал во время сессии
  useEffect(() => {
    if (!user) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      void doRefresh().then((ok) => {
        if (!ok) {
          removeAccessToken();
          setUser(null);
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
        }
      });
    }, REFRESH_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [user, doRefresh]);

  if (isLoading) {
    return null;
  }

  return (
    <AuthContext.Provider
      value={{
        isLoading,
        user,
        refreshUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextValue => useContext(AuthContext);
