import { Metadata } from "next";

import { TogetherPage } from "@/screens/together/ui/TogetherPage";
import { getMetadata } from "@/shared/lib/metadata";
import { routes } from "@/shared/router/paths";
export function generateMetadata(): Metadata {
  return getMetadata({
    title: "Todo",
    description: "Todo",
    url: routes.calendar,
  });
}
export default function TogetherRoute() {
  return <TogetherPage />;
}
