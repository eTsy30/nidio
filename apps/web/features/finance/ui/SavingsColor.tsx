"use client";
import { useState } from "react";

import { useAuth } from "@/shared/api/provider/auth-provider";
import { Button } from "@/shared/ui";

import { useFinance } from "../api/FinanceProvider";
import type { Tone } from "../model/types";

import { FinanceDialog } from "./FinanceDialog";
import { ToneField } from "./FinanceFields";
export function SavingsColor() {
  const { user } = useAuth();
  const { data, write } = useFinance();
  const [open, setOpen] = useState(false);
  const [color, setColor] = useState<Tone>(
    data.members.find((m) => m.id === user?.id)?.savingsColor ?? "primary",
  );
  return (
    <>
      <Button variant="ghost" onClick={() => setOpen(true)}>
        Мой цвет взносов
      </Button>
      {open && (
        <FinanceDialog
          title="Цвет ваших взносов"
          onClose={() => setOpen(false)}
          onSubmit={() => write("/savings-color", "patch", { color })}
        >
          <ToneField value={color} onChange={setColor} />
          <p className="text-sm text-muted-foreground">
            Автор и галочка остаются видны независимо от выбранного цвета.
          </p>
        </FinanceDialog>
      )}
    </>
  );
}
