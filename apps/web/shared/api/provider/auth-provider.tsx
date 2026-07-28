"use client";

import { createContext, type ReactNode, useContext, useEffect, useState } from "react";

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
};

const AuthContext = createContext<AuthContextValue>({
  isAuthenticated: false,
  isLoading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(getAccessToken()));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const response = await http.post<{ accessToken: string }>("/auth/refresh");

        if (response.accessToken) {
          setAccessToken(response.accessToken);
        }
      } catch (error) {
        removeAccessToken();
      } finally {
        setIsLoading(false);
      }
    };

    void bootstrap();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeAuth(() => {
      setIsAuthenticated(Boolean(getAccessToken()));
    });

    return () => {
      unsubscribe();
    };
  }, []);
  if (isLoading) {
    return null;
  }
  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading }}>{children}</AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
