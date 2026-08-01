export function getRemainingTime(expiresAt: string): string {
  const difference = new Date(expiresAt).getTime() - Date.now();

  if (difference <= 0) {
    return "Expired";
  }

  const hours = Math.floor(difference / (1000 * 60 * 60));
  const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));

  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}
