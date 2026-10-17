"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { apolloClient } from "@/shared/lib/apollo-client";

import { subscribeCacheChanged } from "./cache-events";
import { saveOfflineSnapshot } from "./snapshot";

export function useOfflinePersistence(userId: string | undefined): void {
  const client = useQueryClient();
  useEffect(() => {
    if (!userId) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const save = () => {
      clearTimeout(timer);
      saveOfflineSnapshot(client, apolloClient.cache, userId);
    };
    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(save, 250);
    };
    let pairId = client.getQueryData<{ id: string } | null>(["relationship", "couple"])?.id;
    const unsubscribe = client.getQueryCache().subscribe((event) => {
      if (
        event.type === "updated" &&
        event.query.queryKey[0] === "relationship" &&
        event.query.queryKey[1] === "couple" &&
        event.query.state.status === "success"
      ) {
        const nextPair = (event.query.state.data as { id: string } | null)?.id;
        if (pairId && nextPair !== pairId) {
          pairId = nextPair;
          client.removeQueries({
            predicate: (query) =>
              ["together", "loyalty-cards", "savings"].includes(String(query.queryKey[0])),
          });
          void apolloClient
            .clearStore()
            .then(schedule)
            .catch(() => undefined);
        }
        pairId = nextPair;
      }
      schedule();
    });
    const unsubscribeCalendar = subscribeCacheChanged(schedule);
    const onVisibility = () => {
      if (document.visibilityState === "hidden") save();
    };
    window.addEventListener("pagehide", save);
    document.addEventListener("visibilitychange", onVisibility);
    schedule();
    return () => {
      clearTimeout(timer);
      unsubscribe();
      unsubscribeCalendar();
      window.removeEventListener("pagehide", save);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [client, userId]);
}
