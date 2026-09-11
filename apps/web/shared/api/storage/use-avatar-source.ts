"use client";

import { useEffect, useState } from "react";

import { api } from "../client/api";
import { apiConfig } from "../config/api.config";

export function isProtectedImage(src: string | undefined): boolean {
  if (!src) return false;
  try {
    const base = new URL(apiConfig.baseURL);
    const url = new URL(src, base);
    return url.origin === base.origin && url.pathname.startsWith("/storage/images/");
  } catch {
    return false;
  }
}

export function useAvatarSource(src: string | undefined): string | undefined {
  const protectedImage = isProtectedImage(src);
  const [loaded, setLoaded] = useState<{ source: string; url: string } | null>(null);

  useEffect(() => {
    if (!protectedImage || !src) return;

    const controller = new AbortController();
    let objectUrl: string | undefined;

    void api
      .get<Blob>(src, {
        responseType: "blob",
        signal: controller.signal,
      })
      .then(({ data }) => {
        if (controller.signal.aborted) return;
        objectUrl = URL.createObjectURL(data);
        setLoaded({ source: src, url: objectUrl });
      })
      .catch(() => {});

    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [protectedImage, src]);

  return protectedImage ? (loaded && loaded.source === src ? loaded.url : undefined) : src;
}
