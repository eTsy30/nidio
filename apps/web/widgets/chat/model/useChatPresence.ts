"use client";

import { useEffect } from "react";

import { useRealtime } from "@/shared/realtime";

export function useChatPresence() {
  const socket = useRealtime();
  useEffect(() => {
    if (!socket) return;
    const sync = () => {
      if (socket.connected)
        socket.emit("chat:presence", {
          active: document.visibilityState === "visible" && document.hasFocus(),
        });
    };
    const leave = () => {
      if (socket.connected) socket.emit("chat:presence", { active: false });
    };
    sync();
    socket.on("connect", sync);
    document.addEventListener("visibilitychange", sync);
    window.addEventListener("focus", sync);
    window.addEventListener("blur", leave);
    window.addEventListener("pagehide", leave);
    const heartbeat = window.setInterval(sync, 20_000);
    return () => {
      leave();
      clearInterval(heartbeat);
      socket.off("connect", sync);
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("focus", sync);
      window.removeEventListener("blur", leave);
      window.removeEventListener("pagehide", leave);
    };
  }, [socket]);
}
