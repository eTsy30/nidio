export default function Loading() {
  return (
    <main
      className="flex min-h-dvh items-center justify-center p-6"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <span className="sr-only">Загрузка</span>
    </main>
  );
}
