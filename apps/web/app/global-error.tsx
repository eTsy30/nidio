"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: Readonly<{ error: Error; reset: () => void }>) {
  useEffect(() => {
    console.error("Global application error", error);
  }, [error]);

  return (
    <html lang="ru">
      <body>
        <main
          style={{
            fontFamily: "system-ui",
            margin: "4rem auto",
            maxWidth: "32rem",
            padding: "1.5rem",
          }}
        >
          <h1>Не удалось загрузить приложение</h1>
          <p>Попробуйте обновить страницу.</p>
          <button type="button" onClick={reset}>
            Повторить
          </button>
        </main>
      </body>
    </html>
  );
}
