"use client";

import type { Socket } from "socket.io-client";

import { useRealtimeContext } from "../provider/RealtimeProvider";

export function useRealtime(): Socket | null {
  const { socket } = useRealtimeContext();

  return socket;
}
