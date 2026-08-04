import type { Metadata } from "next";

import { ChatPage } from "@/screens/chat";
import { getMetadata } from "@/shared/lib/metadata";
import { routes } from "@/shared/router/paths";

export function generateMetadata(): Metadata {
  return getMetadata({
    title: "Пространство",
    description: "Чат в Nidio.",
    url: routes.chat,
  });
}

export default function ChatsPage() {
  return <ChatPage />;
}
