import type { ReactNode } from "react";

import { GuestGuard } from "@/shared/router/guards/GuestGuard";

type Props = {
  children: ReactNode;
};

export default function PublicLayout({ children }: Props) {
  return <GuestGuard>{children}</GuestGuard>;
}
