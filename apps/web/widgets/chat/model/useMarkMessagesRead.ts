import { useCallback } from "react";
import type { Socket } from "socket.io-client";

import { REALTIME_EVENTS } from "../../../shared/realtime/lib/events";

export function useMarkMessagesRead(socket: Socket | null) {
  return useCallback(
    (messageIds: string[]) => {
      if (!socket) {
        return;
      }

      messageIds.forEach((messageId) => {
        socket.emit(REALTIME_EVENTS.CHAT_READ, {
          messageId,
        });
      });
    },
    [socket],
  );
}
