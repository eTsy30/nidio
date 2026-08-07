import { useCallback } from "react";
import type { Socket } from "socket.io-client";

import type { ClientToServerEvents, ServerToClientEvents } from "@/shared/realtime/types/events";

export function useMarkMessagesRead(
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null,
) {
  return useCallback(
    (messageIds: string[]): void => {
      if (!socket || messageIds.length === 0) return;

      socket.emit("chat:read", { messageIds });
    },
    [socket],
  );
}
