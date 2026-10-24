"use client";
import { useRouter } from "next/navigation";

import { useAcceptInvite, useInvite } from "@/features/relationship/hook/use-relationship";
import { AcceptInviteCard } from "@/features/relationship/ui/accept-invite-card/AcceptInviteCard";
import { cn } from "@/shared/lib/cn";
import { Card } from "@/shared/ui/card/Card";
import { LoadingState } from "@/shared/ui/loading/LoadingState";

interface InviteLandingViewProps {
  token: string;
}

export function InviteLandingView({ token }: InviteLandingViewProps) {
  const { data: invite, isPending } = useInvite(token);
  const router = useRouter();
  const acceptInviteMutation = useAcceptInvite();

  return (
    <main
      className={cn(
        "min-h-screen",
        "bg-background",
        "flex items-center justify-center",
        "p-4 md:p-8",
      )}
    >
      <div className="w-full max-w-md">
        {isPending ? (
          <LoadingState label="Загрузка приглашения" />
        ) : invite ? (
          <AcceptInviteCard
            invite={invite}
            onJoin={() => {
              acceptInviteMutation.mutate(token, {
                onSuccess: () => {
                  router.replace("/?pairing=success");
                },
              });
            }}
          />
        ) : (
          <Card padding="lg" className="text-center">
            <h1 className="text-xl font-semibold">Приглашение недействительно</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Возможно, срок действия приглашения истёк или оно было отозвано.
            </p>
          </Card>
        )}
      </div>
    </main>
  );
}
