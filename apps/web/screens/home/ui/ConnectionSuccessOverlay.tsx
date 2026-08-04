"use client";

import { useRouter } from "next/navigation";

import { useMe } from "@/features/auth";
import { useRealtimeContext } from "@/shared/realtime/provider/RealtimeProvider";
import { routes } from "@/shared/router/paths";
import { AvatarPair } from "@/shared/ui/avatar-pair/AvatarPair";

export function ConnectionSuccessOverlay() {
  const router = useRouter();
  const { data: user } = useMe();
  const { connectionEvent, clearConnectionEvent } = useRealtimeContext();

  const visible = connectionEvent !== null;

  const partner = user?.relationship.partner;

  const currentFallback = user?.firstName?.charAt(0).toUpperCase() ?? "?";
  const partnerFallback = partner?.firstName?.charAt(0).toUpperCase() ?? "?";

  const handleClose = () => {
    clearConnectionEvent();

    router.replace(routes.home);
  };

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay/70 backdrop-blur-xl">
      <div
        className="animate-scale-in w-full max-w-md rounded-[var(--radius-lg)] bg-card p-10 text-center shadow-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto mb-8 flex justify-center">
          <AvatarPair
            leftAvatar={user?.avatarUrl ?? null}
            rightAvatar={partner?.avatarUrl ?? null}
            leftAlt={user?.firstName ?? undefined}
            rightAlt={partner?.firstName ?? undefined}
            leftFallback={currentFallback}
            rightFallback={partnerFallback}
            size="lg"
          />
        </div>

        <h2 className="text-3xl">Теперь вы вместе</h2>

        <p className="description mt-4">
          {partner
            ? `${user?.firstName} и ${partner.firstName}, добро пожаловать в ваше общее пространство.`
            : "Ваше общее пространство создано."}
        </p>

        <button
          type="button"
          onClick={handleClose}
          className="mt-8 h-12 w-full rounded-xl bg-primary font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Перейти домой
        </button>
      </div>
    </div>
  );
}
