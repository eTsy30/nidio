import { useCallback } from "react";
import type { Socket } from "socket.io-client";

import type { ClientToServerEvents, ServerToClientEvents } from "@/shared/realtime/types/events";

export function useRemoveReaction(
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null,
) {
  return useCallback(
    (messageId: string, emoji: string): void => {
      if (!socket) {
        throw new Error("Socket is not connected");
      }

      socket.emit("chat:reaction:remove", { messageId, emoji });
    },
    [socket],
  );
}
