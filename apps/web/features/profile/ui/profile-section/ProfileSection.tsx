import type { ReactNode } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card/Card";

interface ProfileSectionProps {
  title: string;
  children: ReactNode;
}

export function ProfileSection({ title, children }: ProfileSectionProps) {
  return (
    <Card variant="outline" className="rounded-[var(--radius-md)] border-border p-5">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>

      <CardContent className="-mx-5 pt-3">
        <div className="divide-y divide-border/60">{children}</div>
      </CardContent>
    </Card>
  );
}
