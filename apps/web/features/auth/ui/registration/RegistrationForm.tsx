"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import { Mail, User } from "lucide-react";
import { useForm } from "react-hook-form";

import { useAcceptInvite } from "@/features/relationship/hook/use-relationship";
import { cn } from "@/shared/lib/cn";
import { routes } from "@/shared/router/paths";
import { AuthLayout, PasswordInput } from "@/shared/ui";
import { Button } from "@/shared/ui/button/Button";
import { Input } from "@/shared/ui/input/Input";
import { Link } from "@/shared/ui/link/Link";

import { useRegister } from "../../hooks/use-login";
import { RegisterRequest, registerSchema } from "../../model";

import { registrationFeatures } from "./registration-features";

export function RegistrationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");

  const inviteToken = redirect?.startsWith("/invite/") ? (redirect.split("/").pop() ?? null) : null;
  const acceptInviteMutation = useAcceptInvite();
  const {
    register,
    formState: { errors, isValid, isDirty },
    handleSubmit,
  } = useForm<RegisterRequest>({
    mode: "onBlur",
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const firstNameField = register("firstName");
  const emailField = register("email");
  const passwordField = register("password");
  const confirmPasswordField = register("confirmPassword");
  const registerMutation = useRegister();

  async function handleRegisterSubmit(data: RegisterRequest) {
    await registerMutation.mutateAsync(data);

    if (inviteToken) {
      await acceptInviteMutation.mutateAsync(inviteToken);
      router.replace(routes.home);
      return;
    }

    router.replace(redirect ?? routes.invite);
  }

  let errorMessage: string | null = null;
  if (registerMutation.isError) {
    const err = registerMutation.error as AxiosError<{ message?: string }>;
    errorMessage = err.response?.data?.message || "Произошла ошибка. Попробуйте еще раз.";
  }

  const isSubmitDisabled =
    !isDirty || !isValid || registerMutation.isPending || acceptInviteMutation.isPending;

  return (
    <AuthLayout
      title="Создайте аккаунт"
      features={registrationFeatures}
      description="Создайте личное пространство для двоих за минуту."
    >
      <form className={cn("space-y-7")} onSubmit={handleSubmit(handleRegisterSubmit)}>
        <Input
          autoFocus
          required
          autoComplete="given-name"
          label="Имя"
          placeholder="Введите имя"
          leftIcon={<User className="size-5 text-primary" />}
          {...firstNameField}
          disabled={registerMutation.isPending}
          error={errors.firstName?.message}
          onChange={(e) => {
            if (registerMutation.isError) registerMutation.reset();
            firstNameField.onChange(e);
          }}
        />
        <Input
          required
          autoComplete="email"
          label="Электронная почта"
          placeholder="Введите email"
          leftIcon={<Mail className="size-5 text-primary" />}
          {...emailField}
          disabled={registerMutation.isPending}
          error={errors.email?.message}
          onChange={(e) => {
            if (registerMutation.isError) registerMutation.reset();
            emailField.onChange(e);
          }}
        />
        <PasswordInput
          required
          label="Пароль"
          placeholder="Введите пароль"
          {...passwordField}
          disabled={registerMutation.isPending}
          error={errors.password?.message}
          onChange={(e) => {
            if (registerMutation.isError) registerMutation.reset();
            passwordField.onChange(e);
          }}
        />
        <PasswordInput
          required
          label="Подтвердите пароль"
          placeholder="Повторите пароль"
          {...confirmPasswordField}
          disabled={registerMutation.isPending}
          error={errors.confirmPassword?.message}
          onChange={(e) => {
            if (registerMutation.isError) registerMutation.reset();
            confirmPasswordField.onChange(e);
          }}
        />

        {registerMutation.isError && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {errorMessage}
          </div>
        )}
        <Button
          size="lg"
          type="submit"
          fullWidth
          loading={registerMutation.isPending || acceptInviteMutation.isPending}
          disabled={isSubmitDisabled}
        >
          Создать аккаунт
        </Button>

        <p className="mt-2 description text-center text-muted-foreground">
          Уже есть аккаунт?{" "}
          <Link
            href={
              redirect ? `${routes.login}?redirect=${encodeURIComponent(redirect)}` : routes.login
            }
          >
            Войти
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
