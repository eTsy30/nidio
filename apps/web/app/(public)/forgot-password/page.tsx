import { type Metadata } from "next";

import { ForgotPasswordView } from "@/screens/forgot-password";
import { getMetadata } from "@/shared/lib/metadata";
import { routes } from "@/shared/router/paths";

export function generateMetadata(): Metadata {
  return getMetadata({
    title: "Восстановление пароля",
    description: "Восстановление пароля",
    url: routes.forgotPassword,
  });
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordView />;
}
