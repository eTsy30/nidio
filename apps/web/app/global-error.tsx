"use client";

export default function GlobalError({ reset }: Readonly<{ error: Error; reset: () => void }>) {
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
