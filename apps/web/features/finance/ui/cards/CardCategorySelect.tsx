import {
  Coffee,
  Fuel,
  Grid2X2,
  House,
  Layers,
  Pill,
  Popcorn,
  Shirt,
  ShoppingBasket,
  Star,
} from "lucide-react";

import { IconSelect } from "@/shared/ui/select/IconSelect";

import { cardCategories } from "../../model/constants";

const icons = {
  groceries: ShoppingBasket,
  clothes: Shirt,
  home: House,
  entertainment: Popcorn,
  pharmacy: Pill,
  cafes: Coffee,
  fuel: Fuel,
  other: Layers,
};
const categories = Object.entries(cardCategories).map(([value, label]) => {
  const Icon = icons[value as keyof typeof icons];
  return { value, label, icon: <Icon className="size-4" /> };
});
export function CardCategorySelect({
  value,
  onChange,
  filter = false,
}: {
  value: string;
  onChange: (value: string) => void;
  filter?: boolean;
}) {
  const options = filter
    ? [
        { value: "ALL", label: "Все", icon: <Grid2X2 className="size-4" /> },
        { value: "FAVORITES", label: "Избранное", icon: <Star className="size-4" /> },
        ...categories,
      ]
    : categories;
  return (
    <IconSelect
      label={filter ? "Показать карты" : "Категория"}
      value={value}
      onChange={onChange}
      options={options}
    />
  );
}
