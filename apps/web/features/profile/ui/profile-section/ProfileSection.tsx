import type { ReactNode } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card/Card";

interface ProfileSectionProps {
  title: string;
  children: ReactNode;
}

export function ProfileSection({ title, children }: ProfileSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>

      <CardContent className="p-0">
        <div className="divide-y divide-border/60">{children}</div>
      </CardContent>
    </Card>
  );
}
