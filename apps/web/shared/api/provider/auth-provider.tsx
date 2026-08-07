"use client";

import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from "react";

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
};

const AuthContext = createContext<AuthContextValue>({
  isLoading: true,
  user: null,
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);

  const refreshUser = useCallback(async (): Promise<void> => {
    try {
      const me = await http.get<User>("/auth/@me");
      setUser(me);
    } catch {
      removeAccessToken();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const bootstrap = async (): Promise<void> => {
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
      }
    });

    return unsubscribe;
  }, [refreshUser]);

  if (isLoading) {
    return null;
  }

  return (
    <AuthContext.Provider
      value={{
        isLoading,
        user,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextValue => useContext(AuthContext);
