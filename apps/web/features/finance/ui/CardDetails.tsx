import { useState } from "react";
import { Barcode, QrCode, X } from "lucide-react";

import { Button } from "@/shared/ui";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/shared/ui/dialog/dialog";

import { barcodeBits, inferCardCode } from "../model/card-code";
import { cardTones } from "../model/constants";
import type { LoyaltyCard } from "../model/types";
import { useCardWakeLock } from "../model/use-card-wake-lock";

import { CardCode } from "./CardCode";

import styles from "./cards/cards.module.css";

export function CardDetails({
  card,
  onClose,
  animate = true,
}: {
  card: LoyaltyCard;
  onClose: () => void;
  animate?: boolean;
}) {
  const inferred = inferCardCode(card.cardNumber);
  const linear = barcodeBits(card.cardNumber, card.barcodeFormat)
    ? card.barcodeFormat
    : barcodeBits(card.cardNumber, inferred.barcodeFormat)
      ? inferred.barcodeFormat
      : null;
  const [qr, setQr] = useState(!linear);
  useCardWakeLock();
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        layout="custom"
        showCloseButton={false}
        className={`translate-x-0 translate-y-0 sm:max-w-160 data-open:animate-none data-closed:animate-none ${styles.presentation}`}
      >
        <DialogTitle className="sr-only">{card.storeName}</DialogTitle>
        <DialogDescription className="sr-only">Код для предъявления на кассе</DialogDescription>
        <div className={`${styles.flip} ${animate ? "" : styles.instant}`}>
          <div
            aria-hidden="true"
            className={`${styles.front} ${cardTones[card.color]?.surface ?? cardTones.blue.surface}`}
          >
            <span className="text-3xl font-semibold break-words">{card.storeName}</span>
          </div>
          <div className={styles.back}>
            <div className="flex justify-between gap-2 pb-6">
              <Button variant="ghost" iconOnly aria-label="Закрыть карту" onClick={onClose}>
                <X />
              </Button>
              {linear && (
                <Button
                  variant="ghost"
                  iconOnly
                  aria-label={qr ? "Показать штрихкод" : "Показать QR-код"}
                  aria-pressed={qr}
                  onClick={() => setQr(!qr)}
                >
                  {qr ? <Barcode /> : <QrCode />}
                </Button>
              )}
            </div>
            <CardCode value={card.cardNumber} format={qr ? "QR" : linear!} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
