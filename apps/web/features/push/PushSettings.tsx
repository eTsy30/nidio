"use client";

import { useEffect, useState } from "react";

import { http } from "@/shared/api/client/api";
import { Button } from "@/shared/ui/button/Button";

import { disablePush, enablePush, supportsPush } from "./push-client";

type Status = "loading" | "unsupported" | "blocked" | "enabled" | "disabled";

export function PushSettings() {
  const [status, setStatus] = useState<Status>("loading");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function refresh() {
    if (!supportsPush()) {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setStatus("blocked");
      return;
    }
    const registration = await navigator.serviceWorker.getRegistration();
    const subscription = await registration?.pushManager.getSubscription();
    if (!subscription || Notification.permission !== "granted") {
      setStatus("disabled");
      return;
    }
    const result = await http.post<{ enabled: boolean }>("/push/status", {
      endpoint: subscription.endpoint,
    });
    setStatus(result.enabled ? "enabled" : "disabled");
  }

  useEffect(() => {
    const sync = () => {
      void refresh().catch(() => {
        setStatus("disabled");
        setError("Не удалось проверить уведомления. Попробуйте снова.");
      });
    };
    sync();
    window.addEventListener("focus", sync);
    return () => window.removeEventListener("focus", sync);
  }, []);

  async function toggle() {
    setBusy(true);
    setError("");
    try {
      if (status === "enabled") await disablePush();
      else {
        const permission = await Notification.requestPermission();
        await enablePush(permission);
      }
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось изменить настройки уведомлений.");
      if (supportsPush() && Notification.permission === "denied") setStatus("blocked");
    } finally {
      setBusy(false);
    }
  }

  const descriptions: Record<Status, string> = {
    loading: "Проверяем настройки…",
    unsupported:
      "Уведомления недоступны в этом браузере. На iPhone добавьте Nidio на экран «Домой» и откройте приложение оттуда. Требуется iOS 16.4 или новее.",
    blocked:
      "Уведомления заблокированы. Разрешите их в настройках браузера или устройства и вернитесь в приложение.",
    enabled: "Уведомления чата, календаря и задач включены на этом устройстве.",
    disabled:
      "Получайте сообщения чата, напоминания календаря, уведомления об изменении общих событий и назначенных задачах.",
  };

  return (
    <div className="space-y-3 p-4">
      <p className="text-sm font-medium">Уведомления</p>
      <p className="text-sm text-muted-foreground" role="status">
        {descriptions[status]}
      </p>
      {(status === "enabled" || status === "disabled") && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={busy}
          onClick={() => void toggle()}
        >
          {busy
            ? "Сохраняем…"
            : status === "enabled"
              ? "Отключить уведомления"
              : "Включить уведомления"}
        </Button>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
