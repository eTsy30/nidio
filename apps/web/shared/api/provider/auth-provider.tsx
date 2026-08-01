"use client";

import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from "react";

import { http } from "@/shared/api/client/api";
import {
  getAccessToken,
  removeAccessToken,
  setAccessToken,
  subscribeAuth,
} from "@/shared/lib/token";

type AuthContextValue = {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: unknown | null;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(getAccessToken()));
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<unknown | null>(null);

  const refreshUser = useCallback(async () => {
    try {
      const me = await http.get("/auth/@me");
      setUser(me);
      setIsAuthenticated(true);
    } catch {
      removeAccessToken();
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      if (getAccessToken()) {
        await refreshUser();
        setIsLoading(false);
        return;
      }
      try {
        const response = await http.post<{ accessToken: string }>("/auth/refresh");
        if (response.accessToken) {
          setAccessToken(response.accessToken);
          await refreshUser();
        }
      } catch {
        removeAccessToken();
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };
    void bootstrap();
  }, [refreshUser]);

  useEffect(() => {
    const unsubscribe = subscribeAuth(() => {
      if (getAccessToken()) {
        void refreshUser();
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    });
    return () => {
      unsubscribe();
    };
  }, [refreshUser]);

  if (isLoading) {
    return null;
  }
  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, user, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
