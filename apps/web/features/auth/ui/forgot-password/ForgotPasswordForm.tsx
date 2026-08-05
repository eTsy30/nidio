"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import { Mail } from "lucide-react";
import { useForm } from "react-hook-form";

import { cn } from "@/shared/lib/cn";
import { routes } from "@/shared/router/paths";
import { AuthLayout, Button, Input, Link } from "@/shared/ui";

import { useForgotPassword } from "../../hooks/use-login";
import { ForgotPasswordRequest, forgotPasswordSchema } from "../../model";

export function ForgotPasswordForm() {
  const {
    register,
    formState: { errors, isValid, isDirty },
    handleSubmit,
  } = useForm<ForgotPasswordRequest>({
    mode: "onBlur",
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const router = useRouter();

  const { mutateAsync: forgotPassword, isPending, isError, error, reset } = useForgotPassword();

  const emailField = register("email");

  async function handleForgotPasswordSubmit(data: ForgotPasswordRequest): Promise<void> {
    await forgotPassword(data);
    router.replace(routes.login);
  }

  const isSubmitDisabled = isPending || !isDirty || !isValid;

  const errorMessage: string =
    error instanceof AxiosError
      ? (error.message ?? "Не удалось отправить письмо. Попробуйте позже.")
      : "Не удалось отправить письмо. Попробуйте позже.";

  return (
    <AuthLayout
      title="Восстановление пароля"
      description="Введите адрес электронной почты, связанный с вашим аккаунтом. Если аккаунт существует, мы отправим письмо со ссылкой для сброса пароля."
    >
      <form className={cn("space-y-6")} onSubmit={handleSubmit(handleForgotPasswordSubmit)}>
        <Input
          autoFocus
          required
          autoComplete="email"
          label="Электронная почта"
          placeholder="Введите email"
          leftIcon={<Mail className="size-5 text-primary" />}
          {...emailField}
          disabled={isPending}
          error={errors.email?.message}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            if (isError) reset();
            emailField.onChange(e);
          }}
        />

        {isError && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {errorMessage}
          </div>
        )}

        <Button size="lg" type="submit" fullWidth loading={isPending} disabled={isSubmitDisabled}>
          Отправить письмо
        </Button>

        <div className="pt-2 text-center">
          <Link href={routes.login}>Я вспомнил пароль</Link>
        </div>
      </form>
    </AuthLayout>
  );
}

export default ForgotPasswordForm;
