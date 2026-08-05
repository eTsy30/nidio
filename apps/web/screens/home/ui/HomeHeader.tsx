import { useMe } from "@/features/auth";
import { AvatarPair } from "@/shared/ui/avatar-pair/AvatarPair";

export function HomeHeader() {
  const { data: user } = useMe();

  const partner = user?.relationship?.partner;

  const hour = new Date().getHours();

  const greeting = hour < 12 ? "Доброе утро ☀️" : hour < 18 ? "Добрый день 🌤️" : "Добрый вечер 🌙";

  const subtitle = partner ? "Дом там, где вы вдвоём ❤️" : "Пригласите любимого человека ❤️";

  const currentFallback = user?.firstName?.charAt(0).toUpperCase() ?? "?";
  const partnerFallback = partner?.firstName?.charAt(0).toUpperCase() ?? "?";

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        <div>
          <p className="text-xs text-muted-foreground">{greeting}</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight">{subtitle}</h1>
        </div>

        <AvatarPair
          leftAvatar={user?.avatarUrl ?? undefined}
          rightAvatar={partner?.avatarUrl ?? undefined}
          leftAlt={user?.firstName ?? undefined}
          rightAlt={partner?.firstName ?? undefined}
          leftFallback={currentFallback}
          rightFallback={partner ? partnerFallback : undefined}
          size="lg"
        />
      </div>
    </header>
  );
}
