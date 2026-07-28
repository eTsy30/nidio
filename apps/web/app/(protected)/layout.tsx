import type { ReactNode } from "react";

import { AuthGuard } from "@/shared/router/guards/AuthGuard";

type Props = {
  children: ReactNode;
};

export default function ProtectedLayout({ children }: Props) {
  return <AuthGuard>{children}</AuthGuard>;
}
