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
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && user && !pathname.startsWith(routes.invite)) {
      router.replace(routes.home);
    }
  }, [user, isLoading, router, pathname]);

  if (isLoading || user) {
    return null;
  }

  return children;
}
