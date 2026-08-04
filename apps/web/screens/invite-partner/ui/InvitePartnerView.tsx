"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  useCreateInvite,
  useCurrentInvite,
  useLeaveCouple,
} from "@/features/relationship/hook/use-relationship";
import { InvitePartnerCard } from "@/features/relationship/ui";
import { cn } from "@/shared/lib/cn";
import { useRealtimeContext } from "@/shared/realtime/provider/RealtimeProvider";
import { routes } from "@/shared/router/paths";

export function InvitePartnerView() {
  const { data: invite } = useCurrentInvite();
  const createInvite = useCreateInvite();
  const revokeInvite = useLeaveCouple();
  const router = useRouter();
  const { connectionEvent } = useRealtimeContext();

  useEffect(() => {
    if (connectionEvent) {
      router.replace(routes.home);
    }
  }, [connectionEvent, router]);

  const copyInvite = async () => {
    if (!invite?.url) return;
    await navigator.clipboard.writeText(invite.url);
    toast.success("Ссылка скопирована");
  };

  return (
    <div
      className={cn(
        "min-h-screen",
        "bg-background",
        "flex items-center justify-center",
        "p-4 md:p-8",
      )}
    >
      <InvitePartnerCard
        {...(invite && { invite })}
        onCreateInvite={() => createInvite.mutate()}
        isCreating={createInvite.isPending}
        onCopy={copyInvite}
        onRevoke={() => revokeInvite.mutate()}
        isRevoking={revokeInvite.isPending}
      />
    </div>
  );
}
