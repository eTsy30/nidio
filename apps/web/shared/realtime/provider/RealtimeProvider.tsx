"use client";

import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Socket } from "socket.io-client";

import { useAuth } from "@/shared/api/provider/auth-provider";
import { queryKeys } from "@/shared/api/query/query-keys";
import { subscribeAuth } from "@/shared/lib/token";

import { connectSocket, disconnectSocket, getSocket } from "../lib/socket";
import type { ClientToServerEvents, ServerToClientEvents } from "../types/events";

type RealtimeContextValue = {
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
  typingUserId: string | null;
  connectionEvent: boolean;
  clearConnectionEvent: () => void;
};

const RealtimeContext = createContext<RealtimeContextValue>({
  socket: null,
  typingUserId: null,
  connectionEvent: false,
  clearConnectionEvent: () => {},
});

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const socket = getSocket();
  const queryClient = useQueryClient();

  const [typingUserId, setTypingUserId] = useState<string | null>(null);
  const [connectionEvent, setConnectionEvent] = useState(false);

  const clearConnectionEvent = useCallback(() => {
    setConnectionEvent(false);
  }, []);

  useEffect(() => {
    if (isLoading) return;

    if (user) {
      connectSocket();
    } else {
      disconnectSocket();
    }

    return () => {
      disconnectSocket();
    };
  }, [user, isLoading]);

  useEffect(() => {
    return subscribeAuth(() => {
      if (isLoading || !user) return;

      disconnectSocket();
      connectSocket();
    });
  }, [isLoading, user]);

  useEffect(() => {
    function handleTypingStart(data: { userId: string }) {
      setTypingUserId(data.userId);
    }

    function handleTypingStop(data: { userId: string }) {
      setTypingUserId((current) => (current === data.userId ? null : current));
    }

    function refreshCouple() {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.relationship.couple,
      });
    }

    function handleRelationshipConnected() {
      setConnectionEvent(true);
      void queryClient.invalidateQueries({
        queryKey: queryKeys.relationship.couple,
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.relationship.invite,
      });
    }

    socket.on("connect", refreshCouple);
    socket.on("relationship.updated", refreshCouple);
    socket.on("chat.typing.start", handleTypingStart);
    socket.on("chat.typing.stop", handleTypingStop);
    socket.on("relationship.connected", handleRelationshipConnected);

    return () => {
      socket.off("connect", refreshCouple);
      socket.off("relationship.updated", refreshCouple);
      socket.off("chat.typing.start", handleTypingStart);
      socket.off("chat.typing.stop", handleTypingStop);
      socket.off("relationship.connected", handleRelationshipConnected);
    };
  }, [queryClient, socket]);

  return (
    <RealtimeContext.Provider
      value={{ socket, typingUserId, connectionEvent, clearConnectionEvent }}
    >
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtimeContext() {
  return useContext(RealtimeContext);
}
