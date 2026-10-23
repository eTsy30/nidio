"use client";

import { RecoveryScreen } from "@/shared/ui/recovery/RecoveryScreen";

export default function GlobalError({
  reset,
}: Readonly<{ error: Error & { digest?: string }; reset: () => void }>) {
  return (
    <html lang="ru">
      <body style={{ margin: 0 }}>
        <RecoveryScreen reset={reset} global />
      </body>
    </html>
  );
}
