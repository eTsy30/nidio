import type { ReactNode } from "react";

import { ConnectionSuccessOverlay } from "@/screens/home/ui/ConnectionSuccessOverlay";
import { AuthGuard } from "@/shared/router/guards/AuthGuard";
import { BottomNavigation } from "@/widgets/navigation";

type Props = {
  children: ReactNode;
};

export default function ProtectedLayout({ children }: Props) {
  return (
    <AuthGuard>
      <ConnectionSuccessOverlay />

      <div className="min-h-dvh pb-[calc(60px+env(safe-area-inset-bottom))]">{children}</div>

      <BottomNavigation />
    </AuthGuard>
  );
}
