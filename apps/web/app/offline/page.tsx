import Link from "next/link";

export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center gap-4 px-6 py-12">
      <h1 className="text-2xl">Эта страница пока недоступна без сети</h1>
      <p className="text-muted-foreground">
        Подключитесь к интернету, чтобы загрузить её. Ранее сохранённые данные можно открыть на
        главной.
      </p>
      <Link
        href="/"
        className="inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-4 text-primary-foreground"
      >
        На главную
      </Link>
    </main>
  );
}
