"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useMe } from "@/features/auth";
import { HomeView } from "@/screens/home";
import { routes } from "@/shared/router/paths";

export default function Home() {
  const router = useRouter();

  const { data: user, isLoading } = useMe();

  useEffect(() => {
    if (!isLoading && user && !user.relationship.connected) {
      router.replace(routes.invite);
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return null;
  }

  // TODO: Home layout (chat, memories, calendar, notes, settings, !!!!connection overlay)
  return (
    <main className="min-h-screen bg-background">
      <HomeView />
    </main>
  );
}
