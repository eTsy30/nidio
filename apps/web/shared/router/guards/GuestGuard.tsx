"use client";

import { type ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/shared/api/provider/auth-provider";
import { routes } from "@/shared/router/paths";

type Props = {
  children: ReactNode;
};

export function GuestGuard({ children }: Props) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(routes.homepage);
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return null;
  }

  if (isAuthenticated) {
    return null;
  }

  return children;
}
