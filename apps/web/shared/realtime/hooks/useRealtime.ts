"use client";

import type { Socket } from "socket.io-client";

import { useRealtimeContext } from "../provider/RealtimeProvider";
import type { ClientToServerEvents, ServerToClientEvents } from "../types/events";

export function useRealtime(): Socket<ServerToClientEvents, ClientToServerEvents> | null {
  const { socket } = useRealtimeContext();

  return socket;
}
