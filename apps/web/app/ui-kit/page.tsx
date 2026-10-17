import type { Metadata } from "next";

import { UiKitPage } from "@/screens/ui-kit/ui/UiKitPage";

export const metadata: Metadata = {
  title: "Компоненты интерфейса | Nidio",
  robots: { index: false, follow: false },
};
export default function Page() {
  return <UiKitPage />;
}
