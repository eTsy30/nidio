import { useCallback } from "react";
import type { Socket } from "socket.io-client";

import type { ClientToServerEvents, ServerToClientEvents } from "@/shared/realtime/types/events";

type EditMessagePayload = {
  messageId: string;
  dto: {
    content: string;
  };
};

export function useEditMessage(socket: Socket<ServerToClientEvents, ClientToServerEvents> | null) {
  return useCallback(
    ({ messageId, dto }: EditMessagePayload): void => {
      if (!socket) {
        throw new Error("Socket is not connected");
      }

      socket.emit("chat:edit", { messageId, dto });
    },
    [socket],
  );
}
