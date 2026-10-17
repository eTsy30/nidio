"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { CloudUpload, WifiOff } from "lucide-react";

import { useAuth } from "@/shared/api/provider/auth-provider";

import { useOnline } from "./connectivity";
import { type OutboxOperation, queueSavingsSave, removeOutbox } from "./outbox";
import { getSnapshotFailure, subscribeSnapshotFailure } from "./snapshot";
import { useOutbox } from "./use-outbox";

const noSnapshotFailure = () => null;

export function OfflineStatus() {
  const online = useOnline();
  const { user, isOfflineSession } = useAuth();
  const failedUserId = useSyncExternalStore(
    subscribeSnapshotFailure,
    getSnapshotFailure,
    noSnapshotFailure,
  );
  const snapshotFailed = Boolean(user && failedUserId === user.id);
  const operations = useOutbox();
  const [actionError, setActionError] = useState("");
  const pending = operations.filter((operation) => operation.status === "pending");
  const failed = operations.filter((operation) => operation.status === "failed");
  const connected = online && !isOfflineSession;
  if (connected && !operations.length && !actionError && !snapshotFailed) return null;
  const act = (operation: OutboxOperation, retry: boolean) => {
    try {
      setActionError("");
      if (retry) queueSavingsSave(operation);
      else removeOutbox(operation);
    } catch {
      setActionError("Не удалось изменить запись на устройстве. Попробуйте ещё раз.");
    }
  };
  return (
    <div className="max-h-[35dvh] shrink-0 overflow-y-auto border-b border-border bg-muted px-4 py-3 text-sm text-foreground">
      <div role="status" className="flex items-start gap-2">
        {connected ? (
          <CloudUpload className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        ) : (
          <WifiOff className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        )}
        <div>
          {!connected && (
            <p>
              {online ? "Сервер пока недоступен." : "Нет подключения к интернету."} Доступны ранее
              загруженные данные. Взносы в копилке можно отмечать без сети; остальные изменения пока
              требуют подключения.
            </p>
          )}
          {pending.length > 0 && (
            <p>
              Ожидают отправки: {pending.length}. Отметки сохранены на устройстве.{" "}
              {connected
                ? "Отправляем при доступности сервера."
                : "Они отправятся после восстановления связи."}
            </p>
          )}
          {failed.length > 0 && (
            <p>Не удалось отправить: {failed.length}. Проверьте записи ниже.</p>
          )}
        </div>
      </div>
      {snapshotFailed && (
        <p role="alert" className="mt-2 text-destructive">
          Не удалось сохранить свежие данные на устройстве. После перезагрузки без сети они могут
          быть недоступны. Проверьте свободное место и разрешение браузера на хранение данных. Не
          очищайте данные сайта, пока есть неотправленные отметки.
        </p>
      )}
      {failed.length > 0 && (
        <details className="mt-2">
          <summary className="min-h-11 cursor-pointer py-2 font-medium">
            Неотправленные отметки
          </summary>
          <ul className="space-y-3">
            {failed.map((operation) => (
              <li
                key={`${operation.goalId}:${operation.installmentId}`}
                className="rounded-xl border bg-card p-3"
              >
                <p>{operation.error}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Отметка взноса от {new Date(operation.createdAt).toLocaleString("ru-RU")}
                </p>
                <div className="mt-2 flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="min-h-11 px-2 text-primary underline"
                    onClick={() => act(operation, true)}
                  >
                    Повторить
                  </button>
                  <button
                    type="button"
                    className="min-h-11 px-2 underline"
                    onClick={() => act(operation, false)}
                  >
                    Убрать отметку с устройства
                  </button>
                  <Link
                    href="/savings"
                    className="inline-flex min-h-11 items-center px-2 underline"
                  >
                    Открыть копилку
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </details>
      )}
      {actionError && (
        <p role="alert" className="mt-2 text-destructive">
          {actionError}
        </p>
      )}
    </div>
  );
}
