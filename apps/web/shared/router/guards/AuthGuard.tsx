"use client";

import { type ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/shared/api/provider/auth-provider";
import { routes } from "@/shared/router/paths";

type Props = {
  children: ReactNode;
};

export function AuthGuard({ children }: Props) {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      const redirect = `${window.location.pathname}${window.location.search}`;
      router.replace(`${routes.login}?redirect=${encodeURIComponent(redirect)}`);
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return null;
  }

  if (!user) {
    return null;
  }

  return children;
}
