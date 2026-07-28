"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import { Mail } from "lucide-react";
import { useForm } from "react-hook-form";

import { cn } from "@/shared/lib/cn";
import { routes } from "@/shared/router/paths";
import { AuthLayout, PasswordInput } from "@/shared/ui";
import { Button } from "@/shared/ui/button/Button";
import { Input } from "@/shared/ui/input/Input";
import { Link } from "@/shared/ui/link/Link";

import { useLogin } from "../../hooks/use-login";
import { LoginRequest, loginSchema } from "../../model";

import { loginFeatures } from "./login-features";

export function LoginForm() {
  const {
    register,
    formState: { errors, isValid, isDirty },
    handleSubmit,
  } = useForm<LoginRequest>({
    mode: "onBlur",
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const router = useRouter();
  const login = useLogin();
  const emailField = register("email");
  const passwordField = register("password");

  async function handleLoginSubmit(data: LoginRequest) {
    await login.mutateAsync(data);
    router.replace(routes.homepage);
    router.refresh();
  }

  const isSubmitDisabled = login.isPending || !isDirty || !isValid;
  const errorMessage =
    login.error instanceof AxiosError ? login.error.response?.data?.message : "Что-то пошло не так";

  return (
    <AuthLayout
      title="Рады видеть вас снова"
      features={loginFeatures}
      description="Войдите в аккаунт, чтобы открыть ваше пространство для двоих."
    >
      <form className={cn("space-y-7")} onSubmit={handleSubmit(handleLoginSubmit)}>
        <Input
          autoFocus
          required
          autoComplete="email"
          label="Электронная почта"
          placeholder="Введите email"
          leftIcon={<Mail className="size-5 text-primary" />}
          {...emailField}
          disabled={login.isPending}
          error={errors.email?.message}
          onChange={(e) => {
            if (login.isError) login.reset();
            emailField.onChange(e);
          }}
        />

        <PasswordInput
          required
          autoComplete="current-password"
          label="Пароль"
          placeholder="Введите пароль"
          {...passwordField}
          disabled={login.isPending}
          error={errors.password?.message}
          onChange={(e) => {
            if (login.isError) login.reset();
            passwordField.onChange(e);
          }}
        />

        <div className="flex w-full justify-center sm:justify-end">
          <Link
            href={routes.forgotPassword}
            className="description text-center hover:underline underline-offset-4"
          >
            Забыли пароль?
          </Link>
        </div>

        {login.isError && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {errorMessage}
          </div>
        )}
        <Button
          size="lg"
          type="submit"
          fullWidth
          loading={login.isPending}
          disabled={isSubmitDisabled}
        >
          Войти
        </Button>

        <div className="relative py-1">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-card px-4 description text-muted-foreground">или</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button disabled variant="secondary" size="lg">
            Google
          </Button>
          <Button disabled variant="secondary" size="lg">
            Apple
          </Button>
        </div>

        <p className="mt-2 description text-center text-muted-foreground">
          Еще нет аккаунта? <Link href={routes.registration}>Создать аккаунт</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
