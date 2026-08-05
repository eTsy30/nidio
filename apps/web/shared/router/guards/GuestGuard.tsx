"use client";

import { type ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/shared/api/provider/auth-provider";
import { routes } from "@/shared/router/paths";

type GuestGuardProps = {
  children: ReactNode;
};

export function GuestGuard({ children }: GuestGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated && !pathname.startsWith(routes.invite)) {
      router.replace(routes.home);
    }
  }, [isAuthenticated, isLoading, router, pathname]);

  if (isLoading || isAuthenticated) {
    return null;
  }

  return children;
}
