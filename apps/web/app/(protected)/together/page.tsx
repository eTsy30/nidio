import { Suspense } from "react";
import { Metadata } from "next";

import { TogetherPage } from "@/screens/together/ui/TogetherPage";
import { getMetadata } from "@/shared/lib/metadata";
import { routes } from "@/shared/router/paths";
import { LoadingState } from "@/shared/ui/loading/LoadingState";
export function generateMetadata(): Metadata {
  return getMetadata({
    title: "Todo",
    description: "Todo",
    url: routes.calendar,
  });
}
export default function TogetherRoute() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-5xl p-4 sm:p-8">
          <LoadingState label="Загрузка задач" />
        </div>
      }
    >
      <TogetherPage />
    </Suspense>
  );
}
