"use client";
import Link from "next/link";
import {
  ArrowRight,
  CircleCheck,
  Download,
  Eye,
  Heart,
  Mail,
  Plus,
  Search,
  Settings,
  Trash2,
} from "lucide-react";

import { Button } from "@/shared/ui/button/Button";
import { Input } from "@/shared/ui/input/Input";

export default function Home() {
  return (
    <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white  font-extrabold">
        Welcome to Nidio
      </h1>
      Basic
      <Button>Кнопка1</Button>
      Variants
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="icon" iconOnly>
        <Settings />
      </Button>
      Sizes
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
      Full Width
      <Button fullWidth>Продолжить</Button>
      Left Icon
      <Button rightIcon={<ArrowRight />}>Далее</Button>
      Both Icons
      <Button
        leftIcon={<Download />}

        rightIcon={<ArrowRight />}
      >
        Скачать
      </Button>
      Icon Button
      <Button variant="icon" iconOnly>
        <Settings />
      </Button>
      <Button variant="icon" size="sm" iconOnly>
        <Search />
      </Button>
      <Button variant="icon" size="lg" iconOnly>
        <Plus />
      </Button>
      Loading
      <Button loading>Сохранение...</Button>
      Loading + Icon
      <Button
        loading

        leftIcon={<Download />}
      >
        Скачать
      </Button>
      Disabled<Button disabled>Недоступно</Button>
      Disabled Full Width
      <Button
        disabled

        fullWidth
      >
        Продолжить
      </Button>
      Link (Radix Slot)
      <Button asChild>
        <a href="/profile">Профиль</a>
      </Button>
      Next.js Link
      <Button asChild>
        <Link href="/dashboard">Dashboard</Link>
      </Button>
      <Button leftIcon={<Heart />}>Добавить в избранное</Button>
      Favorite<Button leftIcon={<Heart />}>Добавить в избранное</Button>
      <Button leftIcon={<Search />}>Поиск</Button>
      <Button leftIcon={<Mail />}>Отправить</Button>
      <Button
        leftIcon={<Trash2 />}

        variant="secondary"
      >
        Удалить
      </Button>
      <Button
        size="lg"

        rightIcon={<ArrowRight />}
      >
        Начать
      </Button>
      <div className="flex gap-2">
        <Button variant="icon" iconOnly>
          <Search />
        </Button>

        <Button variant="icon" iconOnly>
          <Heart />
        </Button>

        <Button variant="icon" iconOnly>
          <Settings />
        </Button>
      </div>
      <div className="flex gap-3">
        <Button variant="secondary">Отмена</Button>

        <Button>Сохранить</Button>
      </div>
      <div className="mx-auto flex max-w-2xl flex-col gap-8 p-8">
        {/* Basic */}

        <Input placeholder="Введите текст" />

        {/* Label */}

        <Input
          label="Имя"

          placeholder="Введите имя"
        />

        {/* Description */}

        <Input
          label="Пароль"

          description="Минимум 8 символов"
        />

        {/* Error */}

        <Input
          label="Email"

          error="Некорректный email"
        />

        {/* Disabled */}

        <Input
          disabled

          value="Недоступно"
        />

        {/* ReadOnly */}

        <Input
          readOnly

          value="Только чтение"
        />

        {/* Required */}

        <Input
          required

          label="Обязательное поле"
        />

        {/* Sizes */}

        <div className="flex flex-col gap-4">
          <Input size="sm" placeholder="Small" />

          <Input size="md" placeholder="Medium" />

          <Input size="lg" placeholder="Large" />
        </div>

        {/* Variants */}

        <div className="flex flex-col gap-4">
          <Input variant="default" placeholder="Default" />

          <Input variant="filled" placeholder="Filled" />

          <Input variant="ghost" placeholder="Ghost" />
        </div>

        {/* Full width */}

        <Input
          fullWidth

          placeholder="Во всю ширину"
        />

        {/* Left icon */}

        <Input
          leftIcon={<Mail />}

          placeholder="Email"
        />

        {/* Right icon */}

        <Input
          rightIcon={<Search />}

          placeholder="Поиск"
        />

        {/* Both icons */}

        <Input
          leftIcon={<Mail />}

          rightIcon={<CircleCheck />}

          placeholder="Email"
        />

        {/* Email */}

        <Input
          type="email"

          label="Email"

          leftIcon={<Mail />}

          placeholder="mail@example.com"
        />

        {/* Password */}

        <Input
          type="password"

          label="Пароль"

          rightIcon={<Eye />}
        />

        {/* Phone */}

        <Input
          type="tel"

          label="Телефон"

          placeholder="+375 (29) 123-45-67"
        />

        {/* Search */}

        <Input
          type="search"

          leftIcon={<Search />}

          placeholder="Поиск..."
        />

        {/* Number */}

        <Input
          type="number"

          min={0}

          max={100}

          placeholder="Возраст"
        />

        {/* Url */}

        <Input
          type="url"

          placeholder="https://"
        />

        {/* Date */}

        <Input type="date" />

        {/* Time */}

        <Input type="time" />

        {/* DateTime */}

        <Input type="datetime-local" />

        {/* Month */}

        <Input type="month" />

        {/* Week */}

        <Input type="week" />

        {/* Color */}

        <Input type="color" />

        {/* File */}

        <Input type="file" />

        {/* Login form */}

        <div className="rounded-2xl border p-6">
          <h2 className="mb-6 text-xl font-semibold">Login</h2>

          <div className="flex flex-col gap-4">
            <Input
              label="Email"

              type="email"

              leftIcon={<Mail />}

              placeholder="mail@example.com"
            />

            <Input
              label="Пароль"

              type="password"

              rightIcon={<Eye />}
            />
          </div>
        </div>

        {/* Complete example */}

        <Input
          label="Email"

          description="Мы никогда не передадим ваш email третьим лицам."

          leftIcon={<Mail />}

          placeholder="mail@example.com"

          size="lg"

          variant="filled"

          fullWidth
        />
      </div>
    </main>
  );
}
