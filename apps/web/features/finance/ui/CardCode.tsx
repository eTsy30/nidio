import QRCode from "react-qr-code";

import { barcodeBits } from "../model/card-code";

import styles from "./cards/cards.module.css";

export function CardCode({ value, format }: { value: string; format: string }) {
  const bits = barcodeBits(value, format);
  return (
    <div className={styles.code}>
      {format === "QR" ? (
        <QRCode
          value={value}
          fgColor="var(--loyalty-ink)"
          bgColor="var(--loyalty-paper)"
          size={256}
          className="mx-auto h-auto w-full max-w-64"
          title="QR-код карты"
        />
      ) : bits ? (
        <svg
          viewBox={`0 0 ${bits.length + 24} 100`}
          role="img"
          aria-label={`Штрихкод ${format}`}
          className="w-full"
          shapeRendering="crispEdges"
        >
          {[...bits].map((bit, i) =>
            bit === "1" ? (
              <rect key={i} x={i + 12} y={8} width={1} height={84} fill="currentColor" />
            ) : null,
          )}
        </svg>
      ) : (
        <p className="text-center text-sm">Покажите номер или фото карты. Формат кода не указан.</p>
      )}
      <p className="mt-6 select-text break-all text-center font-mono text-xl tracking-wider sm:text-2xl">
        {value}
      </p>
      {bits && bits.length > 200 && (
        <p className="mt-3 text-center text-xs">
          Для крупного кода поверните телефон горизонтально.
        </p>
      )}
    </div>
  );
}
