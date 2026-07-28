export const apiConfig = {
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001",
  timeout: 10000,
} as const;
