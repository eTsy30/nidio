import type { InviteResponse } from "@/features/relationship/model/relationship.types";
import { getRemainingTime } from "@/shared/lib/getRemainingTime";
import { AvatarPair } from "@/shared/ui/avatar-pair/AvatarPair";
import { Button } from "@/shared/ui/button/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card/Card";

export interface AcceptInviteCardProps {
  invite: InviteResponse;
  isJoining?: boolean;
  onJoin: () => void;
}

export function AcceptInviteCard({ invite, isJoining = false, onJoin }: AcceptInviteCardProps) {
  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader className="items-center text-center">
        <div className="mb-2 text-4xl">❤️</div>
        <AvatarPair
          size="lg"
          leftFallback="You"
          rightAvatar={invite.senderAvatarUrl}
          rightAlt={invite.senderFirstName}
          rightFallback={invite.senderFirstName.charAt(0).toUpperCase()}
        />

        <CardTitle>{invite.senderFirstName} приглашает вас в Nidio</CardTitle>

        <CardDescription>
          Создайте ваше общее пространство для общения, совместных планов и важных моментов.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="rounded-2xl border border-border bg-muted/30 p-4 text-center">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Приглашение действует
          </p>
          <p className="mt-1 font-semibold">Ещё {getRemainingTime(invite.expiresAt)}</p>
        </div>

        <Button fullWidth loading={isJoining} onClick={onJoin}>
          Присоединиться
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Нажимая «Присоединиться», вы создадите общее пространство вместе.
        </p>
      </CardContent>
    </Card>
  );
}
