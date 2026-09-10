"use client";

import { createContext, useContext } from "react";

import type { User } from "@/shared/contracts/user";

export type AuthContextValue = {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: User | null;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue>({
  isLoading: true,
  isAuthenticated: false,
  user: null,
  refreshUser: async () => {},
  logout: async () => {},
});

export const useAuth = (): AuthContextValue => useContext(AuthContext);
