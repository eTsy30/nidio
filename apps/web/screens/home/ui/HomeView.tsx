// import { BottomNavigation } from "@/widgets/navigation";

import { HomeContent } from "./HomeContent";
import { HomeHeader } from "./HomeHeader";

export function HomeView() {
  return (
    <>
      <main className="flex min-h-screen flex-col bg-background">
        <HomeHeader />

        <HomeContent />

        {/* <BottomNavigation /> */}
      </main>
    </>
  );
}
