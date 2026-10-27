"use client";

import { type ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/shared/api/provider/auth-provider";
import { routes } from "@/shared/router/paths";
import { LoadingState } from "@/shared/ui/loading/LoadingState";

type Props = {
  children: ReactNode;
};

export function AuthGuard({ children }: Props) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const redirect = `${window.location.pathname}${window.location.search}`;
      router.replace(`${routes.login}?redirect=${encodeURIComponent(redirect)}`);
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-10">
        <LoadingState label="Восстанавливаем вход" />
      </main>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return children;
}
