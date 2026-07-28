import { CalendarDays, Camera, HeartHandshake } from "lucide-react";

import { FeatureProps } from "@/shared/ui/feature/Feature";

export const loginFeatures: FeatureProps[] = [
  {
    icon: <Camera className="size-5" />,
    title: "Общие воспоминания",
    description: "Храните фотографии, видео и самые ценные моменты вашей истории.",
  },
  {
    icon: <CalendarDays className="size-5" />,
    title: "Совместные планы",
    description: "Создавайте события, списки дел и напоминайте друг другу о важном.",
  },
  {
    icon: <HeartHandshake className="size-5" />,
    title: "Личное пространство",
    description: "Ваши переписки, заметки и воспоминания доступны только вам двоим.",
  },
];
