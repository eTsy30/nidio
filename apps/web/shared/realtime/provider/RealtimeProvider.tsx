"use client";

import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Socket } from "socket.io-client";

import { useAuth } from "@/shared/api/provider/auth-provider";

import { connectSocket, disconnectSocket, getSocket } from "../lib/socket";
import type { ClientToServerEvents, ServerToClientEvents } from "../types/events";

type RealtimeContextValue = {
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
  typingUserId: string | null;
};

const RealtimeContext = createContext<RealtimeContextValue>({
  socket: null,
  typingUserId: null,
});

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const socket = getSocket();

  const [typingUserId, setTypingUserId] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated) {
      connectSocket();
    } else {
      disconnectSocket();
    }

    return () => {
      disconnectSocket();
    };
  }, [isAuthenticated, isLoading]);

  useEffect(() => {
    function handleTypingStart(data: { userId: string }) {
      setTypingUserId(data.userId);
    }

    function handleTypingStop(data: { userId: string }) {
      setTypingUserId((current) => (current === data.userId ? null : current));
    }

    socket.on("chat.typing.start", handleTypingStart);
    socket.on("chat.typing.stop", handleTypingStop);

    return () => {
      socket.off("chat.typing.start", handleTypingStart);
      socket.off("chat.typing.stop", handleTypingStop);
    };
  }, [socket, queryClient]);

  return (
    <RealtimeContext.Provider value={{ socket, typingUserId }}>{children}</RealtimeContext.Provider>
  );
}

export function useRealtimeContext() {
  return useContext(RealtimeContext);
}
