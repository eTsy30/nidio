"use client";
import { useState } from "react";
import { Search } from "lucide-react";

import { Checkbox, Input, PasswordInput, Textarea } from "@/shared/ui";
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group";
import { Select } from "@/shared/ui/select/Select";

import { DemoSection } from "./DemoSection";

export function FieldExamples() {
  const [checked, setChecked] = useState(true);
  const [scope, setScope] = useState("personal");
  return (
    <DemoSection
      id="fields"
      title="Поля и выбор"
      description="Обычное поле, варианты оформления, пароль, ошибка и недоступное состояние."
    >
      <div className="grid gap-6 md:grid-cols-2">
        <Input
          label="Название"
          placeholder="Введите любой текст"
          description="Данные останутся только в этом примере."
        />
        <Input
          label="Поиск"
          placeholder="Найти событие"
          variant="filled"
          leftIcon={<Search className="size-4" />}
        />
        <Input
          label="Поле с ошибкой"
          defaultValue="Некорректное значение"
          state="error"
          error="Пример сообщения об ошибке"
          aria-describedby="demo-error-note"
        />
        <Input
          label="Успешное значение"
          defaultValue="Всё верно"
          state="success"
          description="Значение прошло проверку."
        />
        <PasswordInput
          label="Пароль"
          placeholder="Только демонстрационный текст"
          autoComplete="off"
        />
        <Input label="Недоступное поле" defaultValue="Только просмотр" disabled />
        <Input
          label="Предупреждение"
          state="warning"
          placeholder="Нужна проверка"
          description="Пример предупреждения."
        />
        <Input label="Без фона и рамки" variant="ghost" placeholder="Ghost" />
        <label className="space-y-2 text-sm font-semibold">
          <span>Заметка</span>
          <Textarea placeholder="Необязательно" rows={3} />
        </label>
        <Input label="Дата события" type="date" />
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <Select label="Повторять" defaultValue="none">
          <option value="none">Не повторять</option>
          <option value="daily">Каждый день</option>
          <option value="monthly">Каждый месяц</option>
        </Select>
        <Select label="Недоступный выбор" disabled>
          <option>Не выбран</option>
        </Select>
      </div>
      <p id="demo-error-note" className="sr-only">
        Это демонстрация ошибки, ввод не отправляется на сервер.
      </p>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <Checkbox checked={checked} onCheckedChange={(value) => setChecked(value)}>
            Включить напоминания
          </Checkbox>
          <Checkbox disabled>Недоступный выбор</Checkbox>
          <p className="text-sm text-muted-foreground">
            Напоминания: {checked ? "включены" : "выключены"}
          </p>
        </div>
        <fieldset>
          <legend className="mb-3 text-sm font-medium">Область события</legend>
          <RadioGroup value={scope} onValueChange={(value) => setScope(String(value))}>
            {[
              ["personal", "Личное"],
              ["couple", "Общее"],
            ].map(([value, label]) => (
              <label key={value} className="flex min-h-11 items-center gap-3">
                <RadioGroupItem value={value} />
                {label}
              </label>
            ))}
          </RadioGroup>
        </fieldset>
      </div>
    </DemoSection>
  );
}
