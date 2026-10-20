/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import { NetworkOnly, Serwist } from "serwist";

declare const self: ServiceWorkerGlobalScope & { __SW_MANIFEST: import("serwist").PrecacheEntry[] };

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    { matcher: ({ url }) => /^\/finance(?:\/|$)/.test(url.pathname), handler: new NetworkOnly() },
    ...defaultCache,
  ],
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
      body: payload.body || "Новое уведомление",
      icon: "/icons/icon-192x192.png",
      ...(payload.tag ? { tag: payload.tag } : {}),
      data: {
        url: ["/", "/calendar", "/profile", "/together"].includes(payload.url ?? "")
          ? payload.url
          : "/",
      },
    }),
  );
});

self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();
  event.waitUntil(
    (async () => {
      const target = event.notification.data?.url;
      const path = ["/", "/calendar", "/profile", "/together"].includes(target) ? target : "/";
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
