"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import PixelIcon from "@/components/PixelIcon";
import { badgeToSpriteKey } from "@/lib/spriteMap";

const BADGE_INFO: Record<string, { name: string }> = {
  first_expense: { name: "Primer gasto" },
  first_habit: { name: "Primer habito" },
  first_task: { name: "Primera tarea" },
  first_study: { name: "Primera sesion" },
  first_workout: { name: "Primer entreno" },
  streak_7: { name: "Racha de 7" },
  streak_30: { name: "Racha de 30" },
  perfect_week: { name: "Semana perfecta" },
  level_5: { name: "Nivel 5" },
  level_10: { name: "Nivel 10" },
  level_25: { name: "Nivel 25" },
  xp_1000: { name: "1000 XP" },
  study_10h: { name: "10h de estudio" },
  workout_30: { name: "30 entrenos" },
  all_rounder: { name: "Todoterreno" },
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
    <div className="pixel-card h-full">
      <h3 className="pixel-card-title">
        Logros ({unlockedCount}/{total})
      </h3>
      <div className="flex flex-col gap-2 py-2">
        {error && <p className="text-hp">Error: {error}</p>}
        {!error && unlocked === null && (
          <p className="text-muted">Cargando...</p>
        )}
        {!error && unlocked !== null && (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
            {ALL_CODES.map((code) => {
              const info = BADGE_INFO[code];
              const isUnlocked = unlocked.has(code);
              return (
                <div
                  key={code}
                  className={`flex flex-col items-center gap-2 p-3 pixel-card ${
                    isUnlocked ? "" : "opacity-30"
                  }`}
                  title={isUnlocked ? info.name : "Bloqueado"}
                >
                  <PixelIcon
                    name={badgeToSpriteKey(code)}
                    size={64}
                    alt={info.name}
                    className={isUnlocked ? "" : "grayscale"}
                  />
                  <span className="text-center text-[10px] text-[--color-text-muted]">
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