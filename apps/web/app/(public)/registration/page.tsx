import { type Metadata } from "next";

import { RegistrationView } from "@/screens/registration";
import { getMetadata } from "@/shared/lib/metadata";
import { routes } from "@/shared/router/paths";

export function generateMetadata(): Metadata {
  return getMetadata({
    title: "Создание аккаунта",
    description:
      "Создайте аккаунт и откройте личное пространство для двоих: общие воспоминания, планы и заметки в одном месте.",
    url: routes.registration,
  });
}

export default function Registration() {
  return <RegistrationView />;
}
