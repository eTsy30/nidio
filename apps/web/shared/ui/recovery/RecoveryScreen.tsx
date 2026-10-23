"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/shared/ui/button/Button";

import { advance, jump, newRun } from "./runner";

import styles from "./recovery.module.css";

export function RecoveryScreen({ reset, global = false }: { reset: () => void; global?: boolean }) {
  const [mode, setMode] = useState<"idle" | "running" | "paused" | "over">("idle");
  const [run, setRun] = useState(newRun);
  const current = useRef(run);
  const [best, setBest] = useState(0);

  useEffect(() => {
    if (mode !== "running") return;
    let frame = 0;
    let previous = 0;
    const tick = (time: number) => {
      const next = advance(current.current, previous ? (time - previous) / 1000 : 0);
      previous = time;
      current.current = next;
      setRun(next);
      if (next.crashed) {
        setBest((value) => Math.max(value, next.score));
        setMode("over");
      } else frame = requestAnimationFrame(tick);
    };
    const pause = () => {
      if (document.hidden) setMode("paused");
    };
    document.addEventListener("visibilitychange", pause);
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange", pause);
    };
  }, [mode]);

  function play() {
    if (mode === "paused") {
      setMode("running");
      return;
    }
    if (mode !== "running") {
      current.current = newRun();
      setRun(current.current);
      setMode("running");
    } else current.current = jump(current.current);
  }

  const status =
    mode === "idle"
      ? "Нажмите, чтобы начать"
      : mode === "over"
        ? `Ваш счёт: ${run.score}. Ещё раз?`
        : mode === "paused"
          ? "Пауза · нажмите для продолжения"
          : "Прыжок — касание или пробел";
  return (
    <main className={styles.screen}>
      <div className={styles.content}>
        <p className={styles.brand}>Nidio / маленькая пауза</p>
        <h1 className={styles.title}>Кажется, мы споткнулись.</h1>
        <p className={styles.description}>
          {global ? "Приложение не смогло загрузиться." : "Не получилось открыть эту страницу."}{" "}
          Попробуйте ещё раз — или немного поиграйте, пока ждёте.
        </p>
        <div className={styles.actions}>
          <Button className={`${styles.action} ${styles.primary}`} onClick={reset}>
            Попробовать снова
          </Button>
          <a className={styles.action} href="/">
            На главную
          </a>
        </div>
        <button
          type="button"
          className={styles.game}
          onClick={play}
          onBlur={() => {
            if (mode === "running") setMode("paused");
          }}
          onKeyDown={(event) => {
            if ([" ", "Enter", "ArrowUp"].includes(event.key)) {
              event.preventDefault();
              if (!event.repeat) play();
            }
            if (event.key === "Escape") setMode("paused");
          }}
          aria-label={mode === "running" ? "Прыгнуть" : status}
          aria-describedby="runner-help"
        >
          <span className={styles.gameTop}>
            <span>МАЛЕНЬКИЙ ЗАБЕГ</span>
            <span className={styles.score}>
              СЧЁТ {String(run.score).padStart(2, "0")} · ЛУЧШИЙ {best}
            </span>
          </span>
          <svg className={styles.scene} viewBox="0 0 560 200" aria-hidden="true">
            <path d="M0 160H560" stroke="currentColor" opacity=".18" />
            <path
              d="M340 56h52m-26-12h42M170 80h34"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              opacity=".12"
            />
            <ellipse cx="92" cy="163" rx="23" ry="4" fill="currentColor" opacity=".1" />
            <g style={{ transform: `translate(72px, ${116 - run.y}px)` }}>
              <path d="M0 44V20C0 5 9 0 20 0s20 5 20 20v24l-10-5-10 5-10-5Z" fill="currentColor" />
              <circle cx="14" cy="18" r="3" fill="white" />
              <circle cx="29" cy="18" r="3" fill="white" />
              <path
                d="M18 29q4 4 8 0"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </g>
            <g style={{ transform: `translate(${run.x}px, 128px)` }}>
              <rect width="22" height="32" rx="6" fill="currentColor" opacity=".45" />
              <path d="M11 9v14M6 16h10" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </g>
          </svg>
        </button>
        <p className={styles.hint} role="status">
          {status}
        </p>
        <p id="runner-help" className={styles.hint}>
          Перепрыгивайте препятствия. Касание, пробел или ↑ — прыжок.
          <br />
          Esc — пауза. Игра запускается только по вашему нажатию.
        </p>
      </div>
    </main>
  );
}
