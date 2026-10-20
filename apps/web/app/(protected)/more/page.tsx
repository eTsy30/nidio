import Link from "next/link";
import { ChevronRight, CreditCard, Heart, PiggyBank, UserRound, Wallet } from "lucide-react";

const items = [
  { href: "/savings", label: "Копилки", detail: "На ваши общие планы", icon: PiggyBank },
  { href: "/cards", label: "Карты", detail: "Скидки всегда под рукой", icon: CreditCard },
  { href: "/budget", label: "Бюджет", detail: "Доходы, расходы и лимиты", icon: Wallet },
  { href: "/profile", label: "Профиль", detail: "Пара, оформление и настройки", icon: UserRound },
  { href: "/space", label: "Пространство", detail: "Раздел в разработке", icon: Heart },
];
export default function MorePage() {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
        <h1>Ещё</h1>
        <nav
          aria-label="Все разделы"
          className="divide-y divide-border rounded-2xl border border-border bg-card"
        >
          {items.map(({ href, label, detail, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex min-h-20 items-center gap-4 p-4 text-foreground hover:bg-muted hover:no-underline"
            >
              <Icon className="size-6 shrink-0" aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{label}</span>
                <span className="block text-sm text-muted-foreground">{detail}</span>
              </span>
              <ChevronRight className="size-5" aria-hidden="true" />
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
