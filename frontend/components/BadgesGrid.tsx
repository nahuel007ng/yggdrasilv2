"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import PixelIcon from "@/components/PixelIcon";
import { badgeToSpriteKey } from "@/lib/spriteMap";
import { ACHIEVEMENTS, ACHIEVEMENTS_BY_CODE } from "@/lib/achievements";
import SkillTreeModal from "@/components/SkillTreeModal";

interface BadgeRow {
  code: string;
  unlocked_at: string;
}

interface BadgesGridProps {
  unlockedTitles?: string[];
}

export default function BadgesGrid({ unlockedTitles }: BadgesGridProps) {
  const [unlocked, setUnlocked] = useState<Set<string> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [treeOpen, setTreeOpen] = useState(false);

  useEffect(() => {
    supabase
      .from("badges")
      .select("code, unlocked_at")
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setUnlocked(new Set((data ?? []).map((b: BadgeRow) => b.code)));
      });
  }, []);

  const total = ACHIEVEMENTS.length;

  return (
    <div className="pixel-card h-full">
      <div className="flex items-center justify-between mb-2">
        <h3 className="pixel-card-title mb-0 border-0 pb-0">
          Logros ({unlocked ? unlocked.size : 0}/{total})
        </h3>
        <button
          type="button"
          className="pixel-btn"
          onClick={() => setTreeOpen(true)}
        >
          🌳 Árbol
        </button>
      </div>
      <div className="flex flex-col gap-2 py-2">
        {error && <p className="text-hp">Error: {error}</p>}
        {!error && unlocked === null && (
          <p className="text-muted">Cargando...</p>
        )}
        {!error && unlocked !== null && unlocked.size === 0 && (
          <p className="text-muted text-xs">
            Todavía no desbloqueaste logros. ¡Abrí el árbol para ver qué te espera!
          </p>
        )}
        {!error && unlocked !== null && unlocked.size > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
            {Array.from(unlocked).map((code) => {
              const def = ACHIEVEMENTS_BY_CODE[code];
              return (
                <div
                  key={code}
                  className="flex flex-col items-center gap-2 p-3 pixel-card"
                  title={def ? def.name : code}
                >
                  <PixelIcon
                    name={badgeToSpriteKey(code)}
                    size={64}
                    alt={def ? def.name : code}
                  />
                  <span className="text-center text-[10px] text-[--color-text-muted]">
                    {def ? def.name : code}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {treeOpen && (
        <SkillTreeModal
          onClose={() => setTreeOpen(false)}
          unlockedBadges={unlocked ?? new Set()}
          unlockedTitles={new Set(unlockedTitles ?? [])}
        />
      )}
    </div>
  );
}