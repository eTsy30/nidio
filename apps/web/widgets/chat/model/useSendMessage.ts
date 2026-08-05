import { useCallback } from "react";
import type { Socket } from "socket.io-client";

import type { ClientToServerEvents, ServerToClientEvents } from "@/shared/realtime/types/events";

type SendMessagePayload = {
  content: string;
};

export function useSendMessage(socket: Socket<ServerToClientEvents, ClientToServerEvents> | null) {
  return useCallback(
    ({ content }: SendMessagePayload): void => {
      if (!socket) {
        throw new Error("Socket is not connected");
      }

      socket.emit("chat:send", { content });
    },
    [socket],
  );
}
