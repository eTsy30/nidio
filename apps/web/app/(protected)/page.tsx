"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useMe } from "@/features/auth";
import { HomeView } from "@/screens/home";
import { routes } from "@/shared/router/paths";

export default function HomePage() {
  const router = useRouter();

  const { data: user, isLoading } = useMe();

  useEffect(() => {
    if (!isLoading && user && !user.relationship?.connected) {
      router.replace(routes.invite);
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return null;
  }

  return <HomeView />;
}
