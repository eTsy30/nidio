import { Grid2X2, Heart, User } from "lucide-react";

import { IconSelect } from "@/shared/ui/select/IconSelect";

const piggyBankScopes = {
  all: "Все",
  COUPLE: "Общие",
  PERSONAL: "Личные",
};

const options = Object.entries(piggyBankScopes).map(([value, label]) => {
  const icons = {
    all: Grid2X2,
    COUPLE: Heart,
    PERSONAL: User,
  };

  const Icon = icons[value as keyof typeof icons];

  return {
    value,
    label,
    icon: <Icon className="size-4" />,
  };
});

export function PiggyBankScopeSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return <IconSelect label="Тип копилок" value={value} onChange={onChange} options={options} />;
}
