import { Avatar, AvatarFallback } from "@/shared/ui/avatar-pair/Avatar";
import { AvatarPair } from "@/shared/ui/avatar-pair/AvatarPair";
import { Badge } from "@/shared/ui/badge/Badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card/Card";

import { DemoSection } from "./DemoSection";

export function SurfaceExamples() {
  return (
    <DemoSection
      id="surfaces"
      title="Карточки, статусы и аватары"
      description="Готовые компоненты Card, Badge, Avatar и AvatarPair."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {(["default", "outline", "glass"] as const).map((variant) => (
          <Card key={variant} variant={variant} padding="sm">
            <CardHeader>
              <CardTitle>{variant}</CardTitle>
              <CardDescription>Пример карточки проекта</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">Заголовок, описание и содержимое с существующими отступами.</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        {(["primary", "secondary", "success", "warning", "destructive", "outline"] as const).map(
          (variant) => (
            <Badge key={variant} variant={variant}>
              {variant}
            </Badge>
          ),
        )}
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-5">
        {(["sm", "default", "lg"] as const).map((size) => (
          <Avatar key={size} size={size} aria-label={`Аватар ${size}`}>
            <AvatarFallback>АН</AvatarFallback>
          </Avatar>
        ))}
        <AvatarPair leftFallback="А" rightFallback="М" />
      </div>
    </DemoSection>
  );
}
