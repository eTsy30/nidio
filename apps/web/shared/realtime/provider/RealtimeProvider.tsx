"use client";

import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Socket } from "socket.io-client";

import { useAuth } from "@/shared/api/provider/auth-provider";

import { REALTIME_EVENTS } from "../lib/events";
import { connectSocket, disconnectSocket, getSocket } from "../lib/socket";
import type { RelationshipConnectedEvent } from "../types/events";

export type RealtimeContextValue = {
  socket: Socket | null;
  connectionEvent: RelationshipConnectedEvent | null;
  clearConnectionEvent: () => void;
};

const RealtimeContext = createContext<RealtimeContextValue>({
  socket: null,
  connectionEvent: null,
  clearConnectionEvent: () => {},
});

type RealtimeProviderProps = {
  children: ReactNode;
};

export function RealtimeProvider({ children }: RealtimeProviderProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();

  const socket = getSocket();
  const [connectionEvent, setConnectionEvent] = useState<RelationshipConnectedEvent | null>(null);

  useEffect(() => {
    if (isLoading) {
      return;
    }

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
    function handleRelationshipConnected(event: RelationshipConnectedEvent) {
      queryClient.invalidateQueries({
        queryKey: ["auth", "me"],
      });
      setConnectionEvent(event);
    }

    socket.on(REALTIME_EVENTS.RELATIONSHIP_CONNECTED, handleRelationshipConnected);

    return () => {
      socket.off(REALTIME_EVENTS.RELATIONSHIP_CONNECTED, handleRelationshipConnected);
    };
  }, [socket, queryClient]);

  return (
    <RealtimeContext.Provider
      value={{
        socket,
        connectionEvent,
        clearConnectionEvent: () => setConnectionEvent(null),
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtimeContext() {
  return useContext(RealtimeContext);
}
