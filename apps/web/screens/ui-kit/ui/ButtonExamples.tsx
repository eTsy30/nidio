"use client";
import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/shared/ui/button/Button";
import { ChoiceButton } from "@/shared/ui/button/ChoiceButton";
import { Link } from "@/shared/ui/link/Link";

import { DemoSection } from "./DemoSection";

export function ButtonExamples() {
  const [selected, setSelected] = useState(false);
  const [message, setMessage] = useState("Нажмите любую доступную кнопку.");
  return (
    <DemoSection
      id="buttons"
      title="Кнопки и ссылки"
      description="Единая кнопка: действия, иконки, загрузка и недоступные состояния."
    >
      <p className="mb-3 text-sm font-medium">Основные действия</p>
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
      <p className="mb-3 mt-6 text-sm font-medium">Дополнительные действия</p>
      <div className="flex flex-wrap items-center gap-3">
        {(["destructive", "link"] as const).map((variant) => (
          <Button key={variant} variant={variant} onClick={() => setMessage(`${variant}`)}>
            {variant}
          </Button>
        ))}
      </div>
      <ChoiceButton selected={selected} onClick={() => setSelected(!selected)} className="mt-4">
        Выбор: {selected ? "включён" : "выключен"}
      </ChoiceButton>
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
