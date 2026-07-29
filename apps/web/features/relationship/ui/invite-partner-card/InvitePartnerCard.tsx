import * as React from "react";
import QRCode from "react-qr-code";

import { Badge } from "@/shared/ui";
import { AvatarPair } from "@/shared/ui/avatar-pair/AvatarPair";
import { Button } from "@/shared/ui/button/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card/Card";
function getRemainingTime(expiresAt: string) {
  const now = new Date().getTime();
  const expires = new Date(expiresAt).getTime();
  const difference = expires - now;

  if (difference <= 0) {
    return "Expired";
  }

  const hours = Math.floor(difference / (1000 * 60 * 60));
  const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));

  if (hours === 0) {
    return `${minutes}m`;
  }

  return `${hours}h ${minutes}m`;
}

export interface InvitePartnerCardProps {
  isCreating?: boolean;
  onCreateInvite: () => void;
  inviteUrl?: string | undefined;
  expiresAt?: string | undefined;
  isRevoking?: boolean;
  onCopy?: () => Promise<void>;
  onRevoke?: () => void;
}

export function InvitePartnerCard({
  isCreating = false,
  onCreateInvite,
  inviteUrl,
  expiresAt,
  isRevoking = false,
  onCopy,
  onRevoke,
}: InvitePartnerCardProps) {
  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader className="items-center text-center">
        <AvatarPair size="lg" />

        <CardTitle>Пригласите своего партнёра</CardTitle>

        <CardDescription>
          Отправьте приглашение любимому человеку и начните создавать ваше общее пространство
          вместе.
        </CardDescription>
      </CardHeader>

      {!inviteUrl ? (
        <CardContent>
          <Button fullWidth loading={isCreating} onClick={onCreateInvite}>
            Создать приглашение
          </Button>
        </CardContent>
      ) : (
        <CardContent>
          <div className="mx-auto  flex items-center justify-center">
            <Badge variant="success">Приглашение активно</Badge>
          </div>

          <div className="mx-auto mt-3 flex size-52 items-center justify-center rounded-3xl border border-border bg-background ">
            <QRCode value={inviteUrl} size={176} bgColor="transparent" fgColor="currentColor" />
          </div>

          <div className="mt-6">
            <label className="block mb-1 font-medium">Ссылка для партнёра</label>
            <div className="rounded-md bg-muted px-3 py-2 break-all">{inviteUrl}</div>
          </div>

          <Button fullWidth className="mt-4" onClick={onCopy}>
            Скопировать ссылку
          </Button>

          {expiresAt && (
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Действует ещё {getRemainingTime(expiresAt)}
            </p>
          )}

          <Button
            fullWidth
            variant="ghost"
            className="mt-4"
            loading={isRevoking}
            onClick={onRevoke}
          >
            Отозвать приглашение
          </Button>
        </CardContent>
      )}
    </Card>
  );
}
