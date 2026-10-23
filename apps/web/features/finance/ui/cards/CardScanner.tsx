"use client";
import { useEffect, useRef, useState } from "react";
import { Camera, ImagePlus, Keyboard } from "lucide-react";

import { Button, InputControl } from "@/shared/ui";

import type { CardInput } from "../../model/types";

export type ScannedCard = Pick<CardInput, "cardNumber" | "barcodeFormat">;
export function CardScanner({
  onManual,
  onScan,
}: {
  onManual: () => void;
  onScan: (value: ScannedCard) => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const controls = useRef<{ stop: () => void } | null>(null);
  const generation = useRef(0);
  const [camera, setCamera] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const stop = () => {
    generation.current++;
    controls.current?.stop();
    controls.current = null;
  };
  useEffect(() => {
    const hide = () => {
      if (document.hidden) {
        stop();
        setCamera(false);
        setBusy(false);
      }
    };
    document.addEventListener("visibilitychange", hide);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", hide);
    };
  }, []);
  async function scan(file?: File) {
    stop();
    const current = generation.current;
    setError("");
    setBusy(true);
    setCamera(!file);
    let url: string | undefined;
    try {
      if (file && (file.size > 15 * 1024 * 1024 || !file.type.startsWith("image/")))
        throw new Error("Выберите изображение до 15 МБ");
      if (!file && !navigator.mediaDevices?.getUserMedia)
        throw new Error("Камера недоступна. Выберите фото или введите номер вручную.");
      const { BrowserMultiFormatReader, BarcodeFormat } = await import("@zxing/browser");
      if (current !== generation.current) return;
      const reader = new BrowserMultiFormatReader();
      const accept = (text: string, format: number) => {
        const formats: Record<number, CardInput["barcodeFormat"]> = {
          [BarcodeFormat.EAN_13]: "EAN13",
          [BarcodeFormat.EAN_8]: "EAN8",
          [BarcodeFormat.CODE_128]: "CODE128",
          [BarcodeFormat.QR_CODE]: "QR",
        };
        if (current !== generation.current) return;
        stop();
        setCamera(false);
        setBusy(false);
        onScan({ cardNumber: text, barcodeFormat: formats[format] ?? "NONE" });
      };
      if (file) {
        url = URL.createObjectURL(file);
        const result = await reader.decodeFromImageUrl(url);
        accept(result.getText(), result.getBarcodeFormat());
      } else {
        const next = await reader.decodeFromConstraints(
          { audio: false, video: { facingMode: { ideal: "environment" } } },
          video.current!,
          (result) => {
            if (result) accept(result.getText(), result.getBarcodeFormat());
          },
        );
        if (current !== generation.current) next.stop();
        else controls.current = next;
      }
    } catch (e) {
      if (current !== generation.current) return;
      setCamera(false);
      setError(
        e instanceof Error && e.name === "NotAllowedError"
          ? "Нет доступа к камере. Разрешите доступ в браузере или выберите фото."
          : file
            ? "Код не найден на фото. Попробуйте чёткое фото целого кода или введите номер вручную."
            : e instanceof Error
              ? e.message
              : "Не удалось открыть камеру",
      );
    } finally {
      if (url) URL.revokeObjectURL(url);
      if (current === generation.current) setBusy(false);
    }
  }
  return (
    <div className="grid gap-3">
      <video
        ref={video}
        autoPlay
        muted
        playsInline
        hidden={!camera}
        className="aspect-video w-full rounded-lg bg-muted object-cover"
        aria-label="Предпросмотр камеры"
      />
      {camera && (
        <p role="status" className="text-sm text-muted-foreground">
          Наведите камеру на весь штрихкод или QR-код.
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          leftIcon={<Camera />}
          disabled={busy || camera}
          onClick={() => void scan()}
          className="h-11 w-full flex-1 justify-center  sm:w-auto"
        >
          {busy ? "Открываем…" : "Сканировать камерой"}
        </Button>

        <Button
          leftIcon={<ImagePlus />}
          disabled={busy}
          onClick={() => fileInput.current?.click()}
          className="h-11 w-full flex-1 justify-center  sm:w-auto"
        >
          Выбрать из галереи
        </Button>
      </div>
      <InputControl
        ref={fileInput}
        className="hidden"
        aria-label="Фото для распознавания кода"
        type="file"
        accept="image/*"
        disabled={busy}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void scan(file);
          const input = e.currentTarget;
          input.value = "";
        }}
      />
      <Button
        variant="secondary"
        leftIcon={<Keyboard />}
        onClick={() => {
          stop();
          setCamera(false);
          setBusy(false);
          onManual();
        }}
      >
        Ввести код
      </Button>
      <p className="text-xs text-muted-foreground">Тип кода определится автоматически.</p>
    </div>
  );
}
