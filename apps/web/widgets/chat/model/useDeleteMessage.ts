import { useCallback } from "react";
import type { Socket } from "socket.io-client";

import type { ClientToServerEvents, ServerToClientEvents } from "@/shared/realtime/types/events";

type DeleteMessagePayload = {
  messageId: string;
};

export function useDeleteMessage(
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null,
) {
  return useCallback(
    ({ messageId }: DeleteMessagePayload): void => {
      if (!socket) {
        throw new Error("Socket is not connected");
      }

      socket.emit("chat:delete", { messageId });
    },
    [socket],
  );
}
