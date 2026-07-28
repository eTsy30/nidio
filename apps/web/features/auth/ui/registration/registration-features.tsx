import { Heart, Sparkles, Users } from "lucide-react";

import { FeatureProps } from "@/shared/ui/feature/Feature";

export const registrationFeatures: FeatureProps[] = [
  {
    icon: <Heart className="size-5" />,
    title: "Начните свою историю",
    description:
      "Создайте общее пространство, где будут храниться ваши воспоминания, планы и важные моменты.",
  },
  {
    icon: <Users className="size-5" />,
    title: "Пригласите любимого человека",
    description:
      "После регистрации отправьте приглашение и начните пользоваться приложением вместе.",
  },
  {
    icon: <Sparkles className="size-5" />,
    title: "Все готово за минуту",
    description:
      "Создание аккаунта занимает всего несколько секунд — сразу после этого можно начать пользоваться Nidio.",
  },
];
