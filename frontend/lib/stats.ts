// Stats de personaje derivadas — Gamificación V2.2
// stat = 5 + current_level + Σ bonus de logros + Σ bonus de títulos. Cap 999.
import { ACHIEVEMENTS_BY_CODE, TITLES_BY_CODE, type StatKey, type StatBonuses } from "./achievements";

export const STAT_KEYS: StatKey[] = ["STR", "AGI", "VIT", "WIL", "INT"];
export const STAT_MAX = 999;

export const STAT_INFO: Record<StatKey, { name: string; color: string; icon: string }> = {
  STR: { name: "Fuerza", color: "var(--color-hp)", icon: "💪" },
  AGI: { name: "Agilidad", color: "var(--color-gold)", icon: "⚡" },
  VIT: { name: "Vitalidad", color: "var(--color-xp)", icon: "❤️" },
  WIL: { name: "Voluntad", color: "var(--color-purple)", icon: "🔥" },
  INT: { name: "Inteligencia", color: "var(--color-mana)", icon: "🧠" },
};

export function computeStats(
  currentLevel: number,
  unlockedBadgeCodes: string[],
  unlockedTitleCodes: string[],
): Record<StatKey, number> {
  const stats: Record<StatKey, number> = { STR: 0, AGI: 0, VIT: 0, WIL: 0, INT: 0 };
  const base = 5 + (currentLevel || 1);
  for (const k of STAT_KEYS) stats[k] = base;
  const addBonuses = (b?: StatBonuses) => {
    if (!b) return;
    for (const k of STAT_KEYS) stats[k] += b[k] ?? 0;
  };
  for (const code of unlockedBadgeCodes) addBonuses(ACHIEVEMENTS_BY_CODE[code]?.statBonuses);
  for (const code of unlockedTitleCodes) addBonuses(TITLES_BY_CODE[code]?.statBonuses);
  for (const k of STAT_KEYS) stats[k] = Math.min(STAT_MAX, stats[k]);
  return stats;
}