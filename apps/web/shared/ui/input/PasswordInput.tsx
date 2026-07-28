"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";

import { Input, InputProps } from "./Input";

export function PasswordInput({ ...props }: Omit<InputProps, "type" | "rightIcon">) {
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <Input
      {...props}
      type={showPassword ? "text" : "password"}
      rightIcon={
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
          className="pointer-events-auto flex items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
        >
          {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
        </button>
      }
    />
  );
}
