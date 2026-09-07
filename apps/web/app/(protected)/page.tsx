"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useCurrentCouple } from "@/features/relationship/hook/use-relationship";
import { HomeView } from "@/screens/home";
import { routes } from "@/shared/router/paths";

export default function HomePage() {
  const router = useRouter();

  const { data: couple, isLoading } = useCurrentCouple();

  useEffect(() => {
    if (!isLoading && !couple) {
      router.replace(routes.invite);
    }
  }, [couple, isLoading, router]);

  if (isLoading) {
    return null;
  }

  if (!couple) {
    return null;
  }

  return <HomeView />;
}
