import { type Metadata } from "next";

import { ResetPasswordView } from "@/screens/reset-password";
import { getMetadata } from "@/shared/lib/metadata";
import { routes } from "@/shared/router/paths";

export function generateMetadata(): Metadata {
  return getMetadata({
    title: "Новый пароль",
    description: "Создание нового пароля",
    url: routes.resetPassword,
  });
}

export default function ResetPasswordPage() {
  return <ResetPasswordView />;
}
