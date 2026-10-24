"use client";
import { useEffect, useState } from "react";

import { api } from "@/shared/api/client/api";
import { Button } from "@/shared/ui";
import { LoadingState } from "@/shared/ui/loading/LoadingState";
export function CardPhoto({ id, version }: { id: string; version: string }) {
  const [result, setResult] = useState<{ key: string; url: string; error: boolean } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const key = `${id}:${version}:${attempt}`;
  useEffect(() => {
    const controller = new AbortController();
    let objectUrl = "";
    api
      .get<Blob>(`/finance/cards/${id}/image`, { responseType: "blob", signal: controller.signal })
      .then((response) => {
        if (controller.signal.aborted) return;
        objectUrl = URL.createObjectURL(response.data);
        setResult({ key, url: objectUrl, error: false });
      })
      .catch(() => {
        if (!controller.signal.aborted) setResult({ key, url: "", error: true });
      });
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id, key]);
  const current = result?.key === key ? result : null;
  if (current?.error)
    return (
      <Button variant="secondary" onClick={() => setAttempt((n) => n + 1)}>
        Повторить загрузку фото
      </Button>
    );
  return current?.url ? (
    // eslint-disable-next-line @next/next/no-img-element -- authenticated blob URL
    <img
      src={current.url}
      alt="Фотография скидочной карты"
      className="max-h-72 w-full rounded-2xl object-contain"
    />
  ) : (
    <LoadingState label="Загрузка фото" compact />
  );
}
