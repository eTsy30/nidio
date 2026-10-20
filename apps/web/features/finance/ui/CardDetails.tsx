import { useState } from "react";
import { Copy, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/shared/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog/dialog";

import { useFinance } from "../api/FinanceProvider";
import type { LoyaltyCard } from "../model/types";

import { CardCode } from "./CardCode";
import { CardPhoto } from "./CardPhoto";
export function CardDetails({
  card,
  onClose,
  action,
}: {
  card: LoyaltyCard;
  onClose: () => void;
  action: (kind: "edit" | "delete") => void;
}) {
  const [fullscreen, setFullscreen] = useState(false);
  const { write, busy } = useFinance();
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={
          fullscreen ? "h-dvh max-h-dvh max-w-full rounded-none sm:max-w-full" : "sm:max-w-lg"
        }
      >
        <DialogHeader>
          <DialogTitle>{card.storeName}</DialogTitle>
          <DialogDescription>Покажите код кассиру или скопируйте номер.</DialogDescription>
        </DialogHeader>
        <CardCode value={card.cardNumber} format={card.barcodeFormat} />
        <Button variant="secondary" onClick={() => setFullscreen(!fullscreen)}>
          {fullscreen ? "Обычный размер" : "На весь экран"}
        </Button>
        {card.hasImage && <CardPhoto id={card.id} version={card.updatedAt} />}
        {card.comment && <p className="whitespace-pre-wrap break-words text-sm">{card.comment}</p>}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            leftIcon={<Copy />}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(card.cardNumber);
                toast.success("Номер скопирован");
              } catch {
                toast.error("Не удалось скопировать. Выделите номер вручную.");
              }
            }}
          >
            Копировать
          </Button>
          <Button
            variant="icon"
            iconOnly
            aria-label="Изменить карту"
            onClick={() => action("edit")}
          >
            <Pencil />
          </Button>
          <Button
            variant="icon"
            iconOnly
            aria-label="Удалить карту"
            onClick={() => action("delete")}
          >
            <Trash2 />
          </Button>
        </div>
        {card.hasImage && (
          <Button
            variant="ghost"
            disabled={busy}
            onClick={() =>
              void write(`/cards/${card.id}/image`, "delete").catch(() =>
                toast.error("Не удалось удалить фото"),
              )
            }
          >
            Удалить только фото
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
