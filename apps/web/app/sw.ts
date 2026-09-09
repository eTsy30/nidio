/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import { Serwist } from "serwist";

declare const self: ServiceWorkerGlobalScope & { __SW_MANIFEST: import("serwist").PrecacheEntry[] };

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();

self.addEventListener("push", (event: PushEvent) => {
  if (!event.data) return;
  let payload: { title?: string; body?: string; tag?: string; url?: string };
  try {
    payload = event.data.json();
  } catch {
    return;
  }
  event.waitUntil(
    self.registration.showNotification(payload.title || "Nidio", {
      body: payload.body || "Новое сообщение",
      icon: "/icons/icon-192x192.png",
      ...(payload.tag ? { tag: payload.tag } : {}),
      data: {
        url: ["/chat", "/calendar", "/profile"].includes(payload.url ?? "") ? payload.url : "/chat",
      },
    }),
  );
});

self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();
  event.waitUntil(
    (async () => {
      const target = event.notification.data?.url;
      const path = ["/chat", "/calendar", "/profile"].includes(target) ? target : "/chat";
      const url = new URL(path, self.location.origin).href;
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of windows) {
        if (new URL(client.url).origin !== self.location.origin) continue;
        await client.navigate(url);
        await client.focus();
        return;
      }
      await self.clients.openWindow(url);
    })(),
  );
});
