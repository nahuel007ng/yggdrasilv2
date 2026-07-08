"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const BADGE_INFO: Record<string, { emoji: string; name: string }> = {
  first_expense: { emoji: "💰", name: "Primer gasto" },
  first_habit: { emoji: "🔥", name: "Primer habito" },
  first_task: { emoji: "✅", name: "Primera tarea" },
  first_study: { emoji: "📚", name: "Primera sesion" },
  first_workout: { emoji: "💪", name: "Primer entreno" },
  streak_7: { emoji: "🔥", name: "Racha de 7" },
  streak_30: { emoji: "🌟", name: "Racha de 30" },
  perfect_week: { emoji: "⭐", name: "Semana perfecta" },
  level_5: { emoji: "🏅", name: "Nivel 5" },
  level_10: { emoji: "🏆", name: "Nivel 10" },
  level_25: { emoji: "👑", name: "Nivel 25" },
  xp_1000: { emoji: "💎", name: "1000 XP" },
  study_10h: { emoji: "🎓", name: "10h de estudio" },
  workout_30: { emoji: "🏋️", name: "30 entrenos" },
  all_rounder: { emoji: "🌈", name: "Todoterreno" },
};

const ALL_CODES = Object.keys(BADGE_INFO);

interface BadgeRow {
  code: string;
  unlocked_at: string;
}

export default function BadgesGrid() {
  const [unlocked, setUnlocked] = useState<Set<string> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("badges")
      .select("code, unlocked_at")
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setUnlocked(new Set((data ?? []).map((b: BadgeRow) => b.code)));
      });
  }, []);

  const total = ALL_CODES.length;
  const unlockedCount = unlocked ? unlocked.size : 0;

  return (
    <div className="nes-container is-dark with-title h-full">
      <p className="title">Badges ({unlockedCount}/{total})</p>
      <div className="flex flex-col gap-2 py-2">
        {error && <p className="nes-text is-error">Error: {error}</p>}
        {!error && unlocked === null && <p>Cargando...</p>}
        {!error && unlocked !== null && (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
            {ALL_CODES.map((code) => {
              const info = BADGE_INFO[code];
              const isUnlocked = unlocked.has(code);
              return (
                <div
                  key={code}
                  className={`flex flex-col items-center gap-1 p-2 nes-container is-dark rounded ${
                    isUnlocked ? "" : "opacity-40"
                  }`}
                  title={isUnlocked ? info.name : "Bloqueado"}
                >
                  <span className="text-3xl">
                    {isUnlocked ? info.emoji : "???"}
                  </span>
                  <span className="text-white text-center text-[10px] break-words">
                    {isUnlocked ? info.name : "???"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}