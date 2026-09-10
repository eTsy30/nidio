"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

import { changePassword } from "@/features/profile/api/change-password.api";
import type { ApiError } from "@/shared/api/client/api";
import { useAuth } from "@/shared/api/provider/auth-provider";
import type { ChangePasswordRequest, ChangePasswordResponse } from "@/shared/contracts/user";
import { Button } from "@/shared/ui/button/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog/dialog";
import { PasswordInput } from "@/shared/ui/input/PasswordInput";

import {
  type ChangePasswordFormData,
  changePasswordSchema,
} from "../../model/change-password.schema";

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
  const { logout } = useAuth();

  const form = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const mutation = useMutation<ChangePasswordResponse, ApiError, ChangePasswordRequest>({
    mutationFn: changePassword,
  });

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      form.reset();
      mutation.reset();
    }

    onOpenChange(nextOpen);
  };

  const onSubmit = async (data: ChangePasswordFormData) => {
    try {
      await mutation.mutateAsync({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      /*
       * Backend инвалидирует все refresh-токены после
       * успешной смены пароля.
       *
       * Поэтому текущую сессию тоже завершаем через
       * существующий AuthProvider.logout().
       */
      await logout();
    } catch {
      // Ошибка отображается через mutation.error.
    }
  };

  const errorMessage = mutation.error?.response?.data?.message ?? "Не удалось изменить пароль";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Изменить пароль</DialogTitle>

          <DialogDescription>
            Введите текущий пароль и задайте новый. После изменения потребуется войти в аккаунт
            снова.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <PasswordInput
            label="Текущий пароль"
            placeholder="Введите текущий пароль"
            autoComplete="current-password"
            {...form.register("currentPassword")}
            error={form.formState.errors.currentPassword?.message}
          />

          <PasswordInput
            label="Новый пароль"
            placeholder="Минимум 8 символов"
            autoComplete="new-password"
            {...form.register("newPassword")}
            error={form.formState.errors.newPassword?.message}
          />

          <PasswordInput
            label="Повторите новый пароль"
            placeholder="Повторите новый пароль"
            autoComplete="new-password"
            {...form.register("confirmPassword")}
            error={form.formState.errors.confirmPassword?.message}
          />

          {mutation.isError ? (
            <p className="text-sm leading-6 text-destructive">{errorMessage}</p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
              disabled={mutation.isPending}
            >
              Отмена
            </Button>

            <Button type="submit" loading={mutation.isPending}>
              Изменить пароль
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
