import { useEffect, useState } from "react";

export function useCardWakeLock() {
  const [active, setActive] = useState(false);
  useEffect(() => {
    let disposed = false;
    let lock: WakeLockSentinel | undefined;
    async function acquire() {
      if (document.visibilityState !== "visible" || !("wakeLock" in navigator) || lock) return;
      try {
        const next = await navigator.wakeLock.request("screen");
        if (disposed) {
          await next.release();
          return;
        }
        lock = next;
        setActive(true);
        next.addEventListener("release", () => {
          lock = undefined;
          if (!disposed) setActive(false);
        });
      } catch {
        if (!disposed) setActive(false);
      }
    }
    void acquire();
    document.addEventListener("visibilitychange", acquire);
    return () => {
      disposed = true;
      document.removeEventListener("visibilitychange", acquire);
      void lock?.release();
    };
  }, []);
  return active;
}
