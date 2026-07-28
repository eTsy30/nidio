import { type Metadata } from "next";

import { LoginView } from "@/screens/login";
import { getMetadata } from "@/shared/lib/metadata";
import { routes } from "@/shared/router/paths";

export function generateMetadata(): Metadata {
  return getMetadata({
    title: "Вход в личный кабинет",
    description: "Вход в личный кабинет",
    url: routes.login,
  });
}

export default function Login() {
  return <LoginView />;
}
