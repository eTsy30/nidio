"use client";
import { useState } from "react";
import { Undo2 } from "lucide-react";

import { useAuth } from "@/shared/api/provider/auth-provider";
import { Button } from "@/shared/ui";

import { useFinance } from "../api/FinanceProvider";
import type { SavingsEntry } from "../model/types";

import { FinanceDialog } from "./FinanceDialog";
export function CancelSavingsEntry({ entry, goalId }: { entry: SavingsEntry; goalId: string }) {
  const { user } = useAuth();
  const { write } = useFinance();
  const [open, setOpen] = useState(false);
  if (entry.cancelledAt || entry.createdBy !== user?.id) return null;
  return (
    <>
      <Button
        variant="icon"
        iconOnly
        size="sm"
        aria-label="Отменить операцию"
        title="Отменить операцию"
        onClick={() => setOpen(true)}
      >
        <Undo2 className="size-4" />
      </Button>
      {open && (
        <FinanceDialog
          title="Исправить операцию?"
          description="Отмените ошибочную запись"
          submitLabel="Отменить операцию"
          onClose={() => setOpen(false)}
          onSubmit={() => write(`/goals/${goalId}/entries/${entry.id}/cancel`, "post")}
        >
          <p>Операция останется в истории как отменённая. Связанный этап снова станет доступен.</p>
        </FinanceDialog>
      )}
    </>
  );
}
