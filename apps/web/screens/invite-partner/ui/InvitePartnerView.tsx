"use client";
import {
  useCreateInvite,
  useCurrentInvite,
  useLeaveCouple,
} from "@/features/relationship/hook/use-relationship";
import { InvitePartnerCard } from "@/features/relationship/ui";
import { cn } from "@/shared/lib/cn";

export function InvitePartnerView() {
  const { data: invite } = useCurrentInvite();
  const createInvite = useCreateInvite();
  const revokeInvite = useLeaveCouple();
  const copyInvite = async () => {
    if (!invite?.url) return;
    await navigator.clipboard.writeText(invite.url);
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
        inviteUrl={invite?.url}
        expiresAt={invite?.expiresAt}
        onCreateInvite={() => createInvite.mutate()}
        isCreating={createInvite.isPending}
        onCopy={copyInvite}
        onRevoke={() => revokeInvite.mutate()}
        isRevoking={revokeInvite.isPending}
      />
    </div>
  );
}
