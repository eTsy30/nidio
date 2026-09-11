const DEFAULT_DEV_ORIGINS = ['http://localhost:3000'];

export function getFrontendUrl(configured = process.env.FRONTEND_URL): string {
  const firstOrigin = configured
    ?.split(',')
    .map((value) => value.trim())
    .find(Boolean);

  if (!firstOrigin) throw new Error('FRONTEND_URL is not configured');

  const url = new URL(firstOrigin);
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('FRONTEND_URL must use HTTP or HTTPS');
  }
  return url.origin;
}

export function isAllowedOrigin(origin?: string): boolean {
  if (!origin) return true;

  const configured = (process.env.FRONTEND_URL ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const allowed = configured.length > 0 ? configured : DEFAULT_DEV_ORIGINS;

  return allowed.includes(origin);
}

export function originValidator(
  origin: string | undefined,
  callback: (error: Error | null, allowed?: boolean) => void,
) {
  callback(
    isAllowedOrigin(origin) ? null : new Error('Origin is not allowed'),
    true,
  );
}
