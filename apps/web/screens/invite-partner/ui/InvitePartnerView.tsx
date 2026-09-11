"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  useCreateInvite,
  useCurrentCouple,
  useCurrentInvite,
  useLeaveCouple,
} from "@/features/relationship/hook/use-relationship";
import { InvitePartnerCard } from "@/features/relationship/ui";
import { cn } from "@/shared/lib/cn";
import { routes } from "@/shared/router/paths";

export function InvitePartnerView() {
  const { data: invite } = useCurrentInvite();
  const createInvite = useCreateInvite();
  const revokeInvite = useLeaveCouple();
  const router = useRouter();
  const { data: couple, isSuccess } = useCurrentCouple();

  useEffect(() => {
    if (isSuccess && couple) {
      router.replace(routes.home);
    }
  }, [couple, isSuccess, router]);

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
