"use client";

import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from "react";
import type { Gender } from "@prisma/client";

import { http } from "@/shared/api/client/api";
import {
  getAccessToken,
  removeAccessToken,
  setAccessToken,
  subscribeAuth,
} from "@/shared/lib/token";

export interface RelationshipPartner {
  id: string;
  firstName: string;
  avatarUrl: string | null;
}

export interface UserRelationship {
  connected: boolean;
  coupleId: string;
  workspaceId: string;
  partner: RelationshipPartner;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  avatarUrl: string | null;
  gender: Gender;
  emailVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
  relationship: UserRelationship | null;
}

type AuthContextValue = {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => Boolean(getAccessToken()));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<AuthUser | null>(null);

  const refreshUser = useCallback(async (): Promise<void> => {
    try {
      const me = await http.get<AuthUser>("/auth/@me");

      setUser(me);
      setIsAuthenticated(true);
    } catch {
      removeAccessToken();
      setUser(null);
      setIsAuthenticated(false);
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

    return unsubscribe;
  }, [refreshUser]);

  if (isLoading) {
    return null;
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
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
