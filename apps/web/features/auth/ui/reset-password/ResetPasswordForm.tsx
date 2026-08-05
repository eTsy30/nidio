"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock } from "lucide-react";
import { useForm } from "react-hook-form";

import { useResetPassword } from "@/features/auth";
import { cn } from "@/shared/lib/cn";
import { routes } from "@/shared/router/paths";
import { AuthLayout, Button, Link, PasswordInput } from "@/shared/ui";

import { ResetPasswordRequest, resetPasswordSchema } from "../../model";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get("token") ?? "";

  const { mutateAsync: resetPasswordMutation, isPending } = useResetPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordRequest>({
    mode: "onBlur",
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token,
      newPassword: "",
    },
  });

  async function handleSubmitForm(data: ResetPasswordRequest) {
    await resetPasswordMutation(data);

    router.replace(routes.login);
    router.refresh();
  }

  return (
    <AuthLayout
      title="Создайте новый пароль"
      description="Введите новый пароль для вашего аккаунта."
    >
      <form className={cn("space-y-6")} onSubmit={handleSubmit(handleSubmitForm)}>
        <input type="hidden" {...register("token")} />

        <PasswordInput
          autoFocus
          required
          autoComplete="new-password"
          label="Новый пароль"
          placeholder="Введите новый пароль"
          leftIcon={<Lock className="size-5 text-primary" />}
          {...register("newPassword")}
          error={errors.newPassword?.message}
        />

        <Button type="submit" size="lg" fullWidth loading={isPending}>
          Сохранить пароль
        </Button>

        <div className="pt-2 text-center">
          <Link href={routes.login}>Вернуться ко входу</Link>
        </div>
      </form>
    </AuthLayout>
  );
}

export default ResetPasswordForm;
