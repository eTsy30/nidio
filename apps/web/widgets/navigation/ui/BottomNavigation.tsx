"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Home, MessageCircle, User, Users } from "lucide-react";

const navigation = [
  {
    href: "/chat",
    label: "Чат",
    icon: MessageCircle,
  },
  {
    href: "/calendar",
    label: "Календарь",
    icon: CalendarDays,
  },
  {
    href: "/",
    label: "Главная",
    icon: Home,
  },
  {
    href: "/space",
    label: "Место",
    icon: Users,
  },
  {
    href: "/profile",
    label: "Профиль",
    icon: User,
  },
];

export function BottomNavigation() {
  const pathname = usePathname();

  useEffect(() => {
    navigator.vibrate?.(10);
  }, [pathname]);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border/60 bg-card/90 shadow-floating backdrop-blur-xl supports-[padding:max(0px)]:pb-[max(env(safe-area-inset-bottom),0px)]">
      <div className="mx-auto flex h-15 max-w-md items-center justify-between px-3 pb-[env(safe-area-inset-bottom)]">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex min-w-0 flex-1 items-center justify-center"
            >
              <div
                className={`relative flex w-full max-w-[72px] flex-col items-center justify-center gap-1 rounded-2xl px-3 py-2 transition-all duration-300 active:scale-95 ${
                  active
                    ? "bg-primary/10 text-primary shadow-soft"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                }`}
              >
                <div
                  className={`transition-all duration-300 ${active ? "scale-110" : "scale-100"}`}
                >
                  <Icon className="size-[22px]" />
                </div>
                <span className="text-[11px] font-medium leading-none">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
