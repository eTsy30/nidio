"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  CreditCard,
  Ellipsis,
  Heart,
  House,
  ListTodo,
  PiggyBank,
  UserRound,
  Wallet,
} from "lucide-react";

const navigation = [
  { href: "/", label: "День", icon: House },
  { href: "/calendar", label: "Календарь", icon: CalendarDays },
  { href: "/together", label: "Задачи", icon: ListTodo },
  { href: "/savings", label: "Копилки", icon: PiggyBank, desktop: true },
  { href: "/cards", label: "Карты", icon: CreditCard, desktop: true },
  { href: "/budget", label: "Бюджет", icon: Wallet, desktop: true },
  { href: "/profile", label: "Профиль", icon: UserRound, desktop: true },
  { href: "/more", label: "Ещё", icon: Ellipsis, mobile: true },
];

export function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav aria-label="Основная навигация" className="app-navigation">
      <Link
        href="/"
        className="mb-12 hidden items-center gap-3 px-3 text-foreground hover:no-underline lg:flex"
        aria-label="Nidio — главная"
      >
        <span className="flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <Heart className="size-5" aria-hidden="true" />
        </span>
        <span className="text-2xl font-semibold tracking-tight">nidio</span>
      </Link>

      <div className="app-navigation-items mx-auto flex w-full max-w-lg items-center justify-between gap-1 lg:max-w-none lg:flex-col lg:items-stretch lg:gap-2">
        {navigation.map(({ href, label, icon: Icon, desktop, mobile }) => {
          const active =
            href === "/"
              ? pathname === href
              : pathname === href ||
                pathname.startsWith(`${href}/`) ||
                (href === "/more" &&
                  ["/savings", "/cards", "/budget", "/profile", "/space", "/finances"].includes(
                    pathname,
                  ));

          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`nav-item group ${
                desktop ? "!hidden lg:!flex" : ""
              } ${mobile ? "lg:!hidden" : ""} ${active ? "nav-item-active" : ""}`}
            >
              <span className="nav-icon">
                <Icon className="size-5" strokeWidth={active ? 2.2 : 1.7} aria-hidden="true" />
              </span>
              <span className="text-[10px] font-medium sm:text-xs lg:text-sm">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
