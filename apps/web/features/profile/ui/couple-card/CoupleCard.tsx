"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Check, Heart, Loader2, Pencil, UserPlus } from "lucide-react";

import { useUpdateRelationship } from "@/features/relationship/hook/use-relationship";
import type { CurrentCoupleResponse } from "@/features/relationship/model/relationship.types";
import { routes } from "@/shared/router/paths";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar-pair/Avatar";
import { Button } from "@/shared/ui/button/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card/Card";

interface CoupleCardProps {
  couple: CurrentCoupleResponse | null | undefined;
  isLoading?: boolean;
}

const formatRelationshipDate = (date: string) => {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
};

const formatDateForInput = (date: string | null) => {
  if (!date) {
    return "";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
  const day = String(parsedDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export function CoupleCard({ couple, isLoading = false }: CoupleCardProps) {
  const router = useRouter();

  const updateRelationship = useUpdateRelationship();

  const [isEditingDate, setIsEditingDate] = useState(false);
  const [relationshipDate, setRelationshipDate] = useState(() =>
    formatDateForInput(couple?.relationshipAt ?? null),
  );
  const handleInvite = () => {
    router.push(routes.invite);
  };

  const handleStartEditDate = () => {
    setRelationshipDate(formatDateForInput(couple?.relationshipAt ?? null));
    setIsEditingDate(true);
  };

  const handleCancelEditDate = () => {
    setRelationshipDate(formatDateForInput(couple?.relationshipAt ?? null));
    setIsEditingDate(false);
  };

  const handleSaveDate = () => {
    if (!relationshipDate) {
      return;
    }

    updateRelationship.mutate(
      {
        relationshipAt: new Date(`${relationshipDate}T00:00:00.000Z`).toISOString(),
      },
      {
        onSuccess: () => {
          setIsEditingDate(false);
        },
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ваша пара</CardTitle>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-3 py-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            <span>Загрузка информации о паре...</span>
          </div>
        ) : couple ? (
          <div className="space-y-6">
            {/* Partner */}
            <div className="flex items-center gap-4">
              <Avatar size="lg" className="shrink-0">
                <AvatarImage
                  src={couple.partnerAvatarUrl ?? undefined}
                  alt={couple.partnerFirstName ?? "Партнёр"}
                />

                <AvatarFallback>
                  {couple.partnerFirstName?.charAt(0).toUpperCase() ?? "П"}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0">
                <p className="truncate font-medium">{couple.partnerFirstName || "Партнёр"}</p>

                <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Heart className="size-3.5 fill-current" />
                  <span>Ваш партнёр</span>
                </div>
              </div>
            </div>

            {/* Relationship date */}
            <div className="rounded-xl border bg-muted/30 p-4">
              {isEditingDate ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium">Дата начала отношений</p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Укажите день, с которого вы вместе.
                    </p>
                  </div>

                  <input
                    type="date"
                    value={relationshipDate}
                    onChange={(event) => setRelationshipDate(event.target.value)}
                    max={new Date().toISOString().split("T")[0]}
                    className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus:ring-2 focus:ring-primary/20"
                  />

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="primary"
                      size="md"
                      disabled={!relationshipDate || updateRelationship.isPending}
                      onClick={handleSaveDate}
                    >
                      {updateRelationship.isPending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Check className="size-4" />
                      )}
                      Сохранить
                    </Button>

                    <Button
                      type="button"
                      variant="secondary"
                      size="md"
                      disabled={updateRelationship.isPending}
                      onClick={handleCancelEditDate}
                    >
                      Отмена
                    </Button>
                  </div>
                </div>
              ) : couple.relationshipAt ? (
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarDays className="size-4 shrink-0" />
                      <span>Вместе с</span>
                    </div>

                    <p className="mt-1 font-medium capitalize">
                      {formatRelationshipDate(couple.relationshipAt)}
                    </p>
                  </div>

                  <Button type="button" variant="ghost" size="sm" onClick={handleStartEditDate}>
                    <Pencil className="size-4" />
                    Изменить
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <CalendarDays className="size-4" />
                      <span>Дата начала отношений</span>
                    </div>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Добавьте дату, чтобы сохранить вашу годовщину.
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    onClick={handleStartEditDate}
                    className="shrink-0"
                  >
                    Указать дату
                  </Button>
                </div>
              )}

              {updateRelationship.isError && (
                <p className="mt-3 text-sm text-destructive">
                  Не удалось сохранить дату. Попробуйте ещё раз.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">Вы пока не подключены к партнёру</p>

              <p className="mt-1 text-sm text-muted-foreground">
                Пригласите партнёра, чтобы начать пользоваться Nidio вместе.
              </p>
            </div>

            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleInvite}
              className="shrink-0"
            >
              <UserPlus className="size-4" />
              Пригласить партнёра
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
