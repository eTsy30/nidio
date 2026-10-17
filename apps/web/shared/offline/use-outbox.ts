"use client";

import { useSyncExternalStore } from "react";

import { useAuth } from "@/shared/api/provider/auth-provider";

import { listOutbox, outboxRevision, subscribeOutbox } from "./outbox";

export function useOutbox() {
  const { user } = useAuth();
  useSyncExternalStore(subscribeOutbox, outboxRevision, () => 0);
  try {
    return user ? listOutbox(user.id) : [];
  } catch {
    return [];
  }
}
