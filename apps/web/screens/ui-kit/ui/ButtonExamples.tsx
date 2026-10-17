"use client";
import { useState } from "react";
import { Plus } from "lucide-react";

import { Button as PrimitiveButton } from "@/shared/ui/button";
import { Button } from "@/shared/ui/button/Button";
import { Link } from "@/shared/ui/link/Link";

import { DemoSection } from "./DemoSection";

export function ButtonExamples() {
  const [message, setMessage] = useState("Нажмите любую доступную кнопку.");
  return (
    <DemoSection
      id="buttons"
      title="Кнопки и ссылки"
      description="Обе реализации Button, которые уже используются в проекте."
    >
      <p className="mb-3 text-sm font-medium">Основные кнопки · button/Button.tsx</p>
      <div className="flex flex-wrap items-center gap-3">
        {(["primary", "secondary", "ghost"] as const).map((variant) => (
          <Button
            key={variant}
            variant={variant}
            onClick={() => setMessage(`Нажата кнопка ${variant}`)}
          >
            {variant}
          </Button>
        ))}
        <Button
          variant="icon"
          iconOnly
          leftIcon={<Plus />}
          aria-label="Добавить пример"
          onClick={() => setMessage("Нажата кнопка с иконкой")}
        />
        <Button disabled>Недоступна</Button>
        <Button loading>Загрузка</Button>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {(["sm", "md", "lg"] as const).map((size) => (
          <Button
            key={size}
            size={size}
            variant="secondary"
            onClick={() => setMessage(`Размер ${size}`)}
          >
            {size}
          </Button>
        ))}
      </div>
      <p className="mb-3 mt-6 text-sm font-medium">Кнопки на Base UI · button.tsx</p>
      <div className="flex flex-wrap items-center gap-3">
        {(["default", "outline", "secondary", "ghost", "destructive", "link"] as const).map(
          (variant) => (
            <PrimitiveButton
              key={variant}
              variant={variant}
              onClick={() => setMessage(`Base UI: ${variant}`)}
            >
              {variant}
            </PrimitiveButton>
          ),
        )}
      </div>
      <p role="status" className="mt-4 text-sm text-muted-foreground">
        {message}
      </p>
      <div className="mt-5 flex flex-wrap gap-4">
        <Link href="#fields" variant="primary" underline>
          К полям ввода
        </Link>
        <Link href="/" variant="muted">
          На главную
        </Link>
      </div>
    </DemoSection>
  );
}
