"use client";

import { useEffect, useState } from "react";
import { getRandomQuote } from "@/lib/quotes";

interface AchievementToastProps {
  badges: Array<{ code: string; name: string }>;
  onDismissAll: () => void;
}

const TOAST_CSS = `
@keyframes achievement-slide-in {
  from { transform: translateY(-100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
@keyframes achievement-slide-out {
  from { transform: translateY(0); opacity: 1; }
  to { transform: translateY(-100%); opacity: 0; }
}
.achievement-in {
  animation: achievement-slide-in 0.5s ease-out forwards;
}
.achievement-out {
  animation: achievement-slide-out 0.3s ease-in forwards;
}
`;

export default function AchievementToast({ badges, onDismissAll }: AchievementToastProps) {
  const [index, setIndex] = useState(0);
  const [stage, setStage] = useState<"in" | "out">("in");
  const [quote, setQuote] = useState(() => getRandomQuote());
  const [prevIndex, setPrevIndex] = useState(index);

  // Ajustar estado durante el render cuando cambia el indice (patron React)
  if (prevIndex !== index) {
    setPrevIndex(index);
    setQuote(getRandomQuote());
    setStage("in");
  }

  useEffect(() => {
    if (badges.length === 0) return;

    const exitMs = 5000;
    const exitAnimMs = 300;
    const pauseMs = 1000;

    const exitTimer = setTimeout(() => {
      setStage("out");
    }, exitMs);

    const advanceTimer = setTimeout(() => {
      if (index + 1 < badges.length) {
        setIndex((i) => i + 1);
      } else {
        onDismissAll();
      }
    }, exitMs + exitAnimMs + pauseMs);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(advanceTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, badges.length]);

  if (badges.length === 0) return null;
  const badge = badges[index];

  return (
    <div className="fixed top-4 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <style>{TOAST_CSS}</style>
      <div
        className="panel-system max-w-md w-[90vw] p-4"
        style={{
          animation:
            stage === "in"
              ? "achievement-slide-in 0.5s ease-out forwards, pulse-glow 1.5s ease-in-out 2"
              : "achievement-slide-out 0.3s ease-in forwards",
        }}
      >
        <div className="panel-system-title mb-3">SISTEMA</div>
        <div className="flex items-center gap-3">
          <span className="text-2xl" style={{ filter: "drop-shadow(0 0 6px rgba(255, 210, 63, 0.5))" }}>
            🏆
          </span>
          <span className="text-pixel text-[10px] text-gold">¡LOGRO DESBLOQUEADO!</span>
        </div>
        <div
          className="my-3 border-t"
          style={{ borderColor: "var(--color-border)" }}
        />
        <p className="text-pixel text-[11px] text-xp leading-relaxed">{badge.name}</p>
        <p className="text-[11px] text-muted mt-3 leading-relaxed">{quote}</p>
      </div>
    </div>
  );
}