import { type Metadata } from "next";

import { InviteLandingView } from "@/screens/invite-landing/InviteLandingView";
import { getMetadata } from "@/shared/lib/metadata";
import { routes } from "@/shared/router/paths";

export function generateMetadata(): Metadata {
  return getMetadata({
    title: "Приглашение в Nidio",
    description: "Примите приглашение и создайте общее пространство в Nidio.",
    url: routes.inviteToken,
  });
}

export default async function InviteLandingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <InviteLandingView token={token} />;
}
