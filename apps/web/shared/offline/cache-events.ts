const listeners = new Set<() => void>();
export function notifyCacheChanged(): void {
  listeners.forEach((listener) => listener());
}
export function subscribeCacheChanged(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
