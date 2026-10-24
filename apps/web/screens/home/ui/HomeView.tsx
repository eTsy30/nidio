import { HomeContent } from "./HomeContent";
import { HomeHeader } from "./HomeHeader";

export function HomeView() {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
      <div className="mx-auto w-full max-w-5xl space-y-4 px-4 py-6 sm:px-8 sm:py-10">
        <HomeHeader />

        <HomeContent />
      </div>
    </div>
  );
}
