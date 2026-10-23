"use client";

import { RecoveryScreen } from "@/shared/ui/recovery/RecoveryScreen";

export default function ErrorBoundary({
  reset,
}: Readonly<{ error: Error & { digest?: string }; reset: () => void }>) {
  return <RecoveryScreen reset={reset} />;
}
