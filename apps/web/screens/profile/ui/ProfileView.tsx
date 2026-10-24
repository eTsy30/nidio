"use client";

import { useState } from "react";
import { Info, Lock, LogOut, Mail } from "lucide-react";

import { useMe } from "@/features/auth";
import {
  ChangePasswordDialog,
  CoupleCard,
  EditProfileDialog,
  ProfileHeader,
  ProfileRow,
  ProfileSection,
} from "@/features/profile";
import { ProfileThemeToggle } from "@/features/profile/ui/ProfileThemeToggle";
import { PushSettings } from "@/features/push/PushSettings";
import { useCurrentCouple } from "@/features/relationship/hook/use-relationship";
import { useUpdateRelationship } from "@/features/relationship/hook/use-relationship";
import { useAuth } from "@/shared/api/provider/auth-provider";
import { Button } from "@/shared/ui/button/Button";

export function ProfileView() {
  const { logout } = useAuth();
  const { data: user } = useMe();

  const { data: couple, isLoading: isCoupleLoading } = useCurrentCouple();
  const updateRelationship = useUpdateRelationship();

  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
      <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-8 sm:py-10">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Профиль</h1>
          <p className="mt-2 text-sm text-muted-foreground">Ваша пара, оформление и настройки</p>
        </div>
        <ProfileHeader
          firstName={user.firstName}
          email={user.email}
          avatarUrl={user.avatarUrl}
          onEdit={() => setIsEditProfileOpen(true)}
        />

        <CoupleCard
          couple={couple}
          isLoading={isCoupleLoading}
          isSavingRelationshipDate={updateRelationship.isPending}
          relationshipDateSaveError={updateRelationship.isError}
          onSaveRelationshipDate={(relationshipAt) =>
            updateRelationship.mutateAsync({ relationshipAt })
          }
        />

        <ProfileSection title="Настройки">
          <PushSettings />

          <ProfileThemeToggle />
        </ProfileSection>

        <ProfileSection title="Безопасность">
          <ProfileRow
            label="Email"
            description={
              user.emailVerifiedAt
                ? "Адрес электронной почты подтверждён"
                : "Адрес электронной почты не подтверждён"
            }
            icon={<Mail className="size-4" />}
            value={user.email}
            disabled
          />

          <ProfileRow
            label="Изменить пароль"
            description="Установить новый пароль"
            icon={<Lock className="size-4" />}
            onClick={() => setIsChangePasswordOpen(true)}
          />
        </ProfileSection>

        <ProfileSection title="О приложении">
          <ProfileRow
            label="Nidio"
            description="Приложение для пар"
            icon={<Info className="size-4" />}
            disabled
          />
        </ProfileSection>

        <Button
          type="button"
          variant="ghost"
          size="md"
          onClick={() => void logout()}
          className="w-full justify-center text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="size-4" />
          Выйти
        </Button>
      </div>

      <EditProfileDialog user={user} open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen} />

      <ChangePasswordDialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen} />
    </div>
  );
}
