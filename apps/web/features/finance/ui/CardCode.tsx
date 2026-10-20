import QRCode from "react-qr-code";

import { ean13Bits } from "../model/barcode";
export function CardCode({ value, format }: { value: string; format: string }) {
  const bits = format === "EAN13" ? ean13Bits(value) : null;
  return (
    <div className="rounded-2xl bg-primary-foreground p-4 text-foreground dark:text-background">
      {format === "QR" ? (
        <QRCode
          value={value}
          fgColor="currentColor"
          bgColor="transparent"
          size={256}
          className="mx-auto h-auto w-full max-w-64"
          title="QR-код сохранённого номера карты"
        />
      ) : bits ? (
        <svg
          viewBox="0 0 113 65"
          role="img"
          aria-label={`Штрихкод EAN-13: ${value}`}
          className="w-full"
          shapeRendering="crispEdges"
        >
          {[...bits].map((bit, i) =>
            bit === "1" ? (
              <rect key={i} x={i + 11} y={5} width={1} height={50} fill="currentColor" />
            ) : null,
          )}
        </svg>
      ) : (
        <p className="text-center text-sm">Формат кода не указан. Покажите номер или фото карты.</p>
      )}
      <p className="mt-3 break-all text-center font-mono text-xl tracking-wider">{value}</p>
    </div>
  );
}
