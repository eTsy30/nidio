import { useCallback } from "react";
import type { Socket } from "socket.io-client";

import { REALTIME_EVENTS } from "@/shared/realtime/lib/events";

type SendMessagePayload = {
  content: string;
};

export function useSendMessage(socket: Socket | null) {
  return useCallback(
    async ({ content }: SendMessagePayload) => {
      if (!socket) {
        throw new Error("Socket is not connected");
      }

      socket.emit(REALTIME_EVENTS.CHAT_SEND, {
        content,
      });
    },
    [socket],
  );
}
