const listeners = new Set<() => void>();

let accessToken: string | null = null;

export const getAccessToken = (): string | null => accessToken;

export const setAccessToken = (token: string): void => {
  accessToken = token;
  listeners.forEach((listener) => listener());
};

export const removeAccessToken = (): void => {
  accessToken = null;
  listeners.forEach((listener) => listener());
};

export const subscribeAuth = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
