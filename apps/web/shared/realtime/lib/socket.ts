import { io, type Socket } from "socket.io-client";

import { getAccessToken } from "@/shared/lib/token";

import type { ClientToServerEvents, ServerToClientEvents } from "../types/events";

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

export function getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> {
  if (socket) {
    return socket;
  }

  const url = process.env.NEXT_PUBLIC_REALTIME_URL;

  if (!url) {
    throw new Error("NEXT_PUBLIC_REALTIME_URL is not defined");
  }

  socket = io(url, {
    autoConnect: false,
    transports: ["websocket"],
    withCredentials: true,
    auth: (cb: (data: { token: string | null }) => void) => {
      cb({
        token: getAccessToken(),
      });
    },
  });

  return socket;
}

export function connectSocket(): Socket<ServerToClientEvents, ClientToServerEvents> {
  const client = getSocket();

  if (!client.connected) {
    client.connect();
  }

  return client;
}

export function disconnectSocket(): void {
  socket?.disconnect();
}
