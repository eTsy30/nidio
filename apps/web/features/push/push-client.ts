import { http } from "@/shared/api/client/api";

export function supportsPush() {
  return (
    typeof window !== "undefined" &&
    window.isSecureContext &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export async function getPushRegistration() {
  const existing = await navigator.serviceWorker.getRegistration();
  if (existing?.active) return existing;

  const registration = await Promise.race([
    navigator.serviceWorker.ready,
    new Promise<never>((_resolve, reject) => {
      window.setTimeout(
        () =>
          reject(
            new Error(
              "Уведомления пока недоступны. Запустите production-сборку приложения и обновите страницу.",
            ),
          ),
        5_000,
      );
    }),
  ]);
  if (!registration.active)
    throw new Error(
      "Уведомления пока недоступны. Запустите production-сборку приложения и обновите страницу.",
    );
  return registration;
}

export async function disablePush() {
  if (!supportsPush()) return;
  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return;
  // Revoke locally even when the API is temporarily unavailable (including logout).
  try {
    await http.post("/push/unsubscribe", { endpoint: subscription.endpoint });
  } finally {
    await subscription.unsubscribe();
  }
}

export async function enablePush(permission: NotificationPermission) {
  if (permission !== "granted")
    throw new Error("Разрешите уведомления в настройках браузера или устройства.");
  const { publicKey } = await http.get<{ publicKey: string | null }>("/push/config");
  if (!publicKey) throw new Error("Уведомления ещё не настроены на сервере.");
  const registration = await getPushRegistration();
  const key = Uint8Array.from(atob(publicKey.replace(/-/g, "+").replace(/_/g, "/")), (c) =>
    c.charCodeAt(0),
  );
  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: key,
    }));
  const json = subscription.toJSON();
  await http.post("/push/subscribe", { endpoint: subscription.endpoint, keys: json.keys });
}
