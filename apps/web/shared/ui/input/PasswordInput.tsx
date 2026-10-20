"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";

import { Button } from "../button/Button";

import { Input, InputProps } from "./Input";

export function PasswordInput({ ...props }: Omit<InputProps, "type" | "rightIcon">) {
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <Input
      {...props}
      type={showPassword ? "text" : "password"}
      rightIcon={
        <Button
          variant="icon"
          iconOnly
          className="size-11"
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
        >
          {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
        </Button>
      }
    />
  );
}
