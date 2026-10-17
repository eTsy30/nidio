"use client";

import { useOnline } from "@/shared/offline/connectivity";
import { Button } from "@/shared/ui/button/Button";

export function DataUnavailable({ onRetry }: { onRetry: () => unknown }) {
  const online = useOnline();
  return (
    <div className="mx-auto w-full max-w-md space-y-3 p-6 text-center" role="status">
      <p className="font-medium">
        {online ? "Не удалось загрузить данные" : "Эти данные ещё не сохранены на устройстве"}
      </p>
      <p className="text-sm text-muted-foreground">
        {online
          ? "Попробуйте ещё раз. Если ошибка повторяется, вернитесь немного позже."
          : "Откройте раздел с подключением к интернету, чтобы он стал доступен без сети."}
      </p>
      {online && (
        <Button
          variant="secondary"
          onClick={() => {
            void onRetry();
          }}
        >
          Попробовать снова
        </Button>
      )}
    </div>
  );
}
