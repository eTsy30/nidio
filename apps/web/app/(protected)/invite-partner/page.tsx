import { type Metadata } from "next";

import { InvitePartnerView } from "@/screens/invite-partner";
import { getMetadata } from "@/shared/lib/metadata";
import { routes } from "@/shared/router/paths";

export function generateMetadata(): Metadata {
  return getMetadata({
    title: "Пригласить партнёра",
    description:
      "Отправьте приглашение своему партнёру и создайте ваше общее пространство в Nidio.",
    url: routes.invitePartner,
  });
}

export default function InvitePartner() {
  return <InvitePartnerView />;
}
