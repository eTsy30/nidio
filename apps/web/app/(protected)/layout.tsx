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
      <main className="flex h-[calc(100dvh-60px)] min-h-0 flex-col overflow-hidden bg-background">
        {children}
      </main>

      <BottomNavigation />
    </AuthGuard>
  );
}
