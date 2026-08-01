import type { ReactNode } from "react";

import { ConnectionSuccessOverlay } from "@/screens/home/ui/ConnectionSuccessOverlay";
import { AuthGuard } from "@/shared/router/guards/AuthGuard";

type Props = {
  children: ReactNode;
};

export default function ProtectedLayout({ children }: Props) {
  return (
    <AuthGuard>
      <ConnectionSuccessOverlay />
      {children}
    </AuthGuard>
  );
}
