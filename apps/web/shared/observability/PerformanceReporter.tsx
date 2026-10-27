"use client";
import { useReportWebVitals } from "next/web-vitals";

let sampled: boolean | undefined;
let sent = 0;
const routes = new Set([
  "/",
  "/login",
  "/calendar",
  "/together",
  "/cards",
  "/savings",
  "/budget",
  "/profile",
  "/more",
  "/space",
  "/finances",
]);
export function PerformanceReporter() {
  useReportWebVitals((metric) => {
    if (process.env.NEXT_PUBLIC_PERFORMANCE_METRICS !== "1") return;
    sampled ??= Math.random() < 0.1;
    if (!sampled || sent >= 10 || !["LCP", "INP", "CLS", "TTFB", "FCP"].includes(metric.name))
      return;
    const path = window.location.pathname;
    const route = routes.has(path) ? path : path.startsWith("/savings/") ? "/savings/:id" : "other";
    sent++;
    // No user/session IDs, URLs with parameters, or content of the page.
    navigator.sendBeacon?.(
      "/api/metrics",
      JSON.stringify({ name: metric.name, value: metric.value, route }),
    );
  });
  return null;
}
