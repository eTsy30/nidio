import type { Metadata } from "next";

import { ProfileView } from "@/screens/profile";
import { getMetadata } from "@/shared/lib/metadata";
import { routes } from "@/shared/router/paths";

export function generateMetadata(): Metadata {
  return getMetadata({
    title: "Профиль",
    description: "Профиль в Nidio.",
    url: routes.profile,
  });
}

export default function ProfilePage() {
  return <ProfileView />;
}
