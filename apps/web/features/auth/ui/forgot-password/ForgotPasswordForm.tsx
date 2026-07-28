"use client";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail } from "lucide-react";
import { useForm } from "react-hook-form";

import { cn } from "@/shared/lib/cn";
import { routes } from "@/shared/router/paths";
import { AuthLayout, Button, Input, Link } from "@/shared/ui";

import { useForgotPassword } from "../../hooks/use-login";
import { ForgotPasswordRequest, forgotPasswordSchema } from "../../model";

function ForgotPasswordForm() {
  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm<ForgotPasswordRequest>({
    mode: "onBlur",
    resolver: zodResolver(forgotPasswordSchema),
  });
  const router = useRouter();
  const forgotPasswordMutation = useForgotPassword();
  async function handleForgotPasswordSubmit(data: ForgotPasswordRequest) {
    await forgotPasswordMutation.mutateAsync(data);
    router.replace(routes.login);
    router.refresh();
  }
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
          {...register("email")}
          error={errors.email?.message}
        />
        <Button size="lg" type="submit" loading={forgotPasswordMutation.isPending} fullWidth>
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
