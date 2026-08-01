import { io, type Socket } from "socket.io-client";

import { getAccessToken } from "@/shared/lib/token";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (socket) {
    return socket;
  }

  socket = io(process.env.NEXT_PUBLIC_REALTIME_URL ?? "", {
    autoConnect: false,
    transports: ["websocket"],
    withCredentials: true,
    auth: (cb) => {
      cb({
        token: getAccessToken(),
      });
    },
  });

  return socket;
}

export function connectSocket(): Socket {
  const client = getSocket();

  if (!client.connected) {
    client.connect();
  }

  return client;
}

export function disconnectSocket() {
  socket?.disconnect();
}
