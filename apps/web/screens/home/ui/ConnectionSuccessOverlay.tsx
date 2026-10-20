"use client";

import { useRouter } from "next/navigation";

import { useMe } from "@/features/auth";
import { useCurrentCouple } from "@/features/relationship/hook/use-relationship";
import { useRealtimeContext } from "@/shared/realtime/provider/RealtimeProvider";
import { routes } from "@/shared/router/paths";
import { AvatarPair } from "@/shared/ui/avatar-pair/AvatarPair";
import { Button } from "@/shared/ui/button/Button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/shared/ui/dialog/dialog";

export function ConnectionSuccessOverlay() {
  const router = useRouter();
  const { data: user } = useMe();
  const { data: couple } = useCurrentCouple();
  const { connectionEvent, clearConnectionEvent } = useRealtimeContext();

  const visible = connectionEvent;

  const partner = couple
    ? {
        firstName: couple.partnerFirstName ?? "Партнёр",
        avatarUrl: couple.partnerAvatarUrl,
      }
    : null;

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
    <Dialog open={Boolean(visible)} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="text-center sm:max-w-md p-6 sm:p-10">
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

        <DialogTitle className="text-3xl">Теперь вы вместе</DialogTitle>

        <DialogDescription className="mt-4">
          {partner
            ? `${user?.firstName} и ${partner.firstName}, добро пожаловать в ваше общее пространство.`
            : "Ваше общее пространство создано."}
        </DialogDescription>

        <Button variant="primary" fullWidth type="button" onClick={handleClose} className="mt-8">
          Перейти домой
        </Button>
      </DialogContent>
    </Dialog>
  );
}
