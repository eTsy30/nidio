let accessToken: string | null = null;

const listeners = new Set<() => void>();

export const getAccessToken = () => accessToken;

export const setAccessToken = (token: string) => {
  accessToken = token;
  listeners.forEach((listener) => listener());
};

export const removeAccessToken = () => {
  accessToken = null;
  listeners.forEach((listener) => listener());
};

export const subscribeAuth = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
