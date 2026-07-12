"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import AchievementToast from "@/components/AchievementToast";

const SEEN_BADGES_KEY = "seenBadgeCodes";

const BADGE_NAMES: Record<string, string> = {
  first_expense: "Primer gasto",
  first_habit: "Primer hábito",
  first_task: "Primera tarea",
  first_study: "Primera sesión",
  first_workout: "Primer entrenamiento",
  streak_7: "Semana de fuego",
  streak_30: "Mes imparable",
  perfect_week: "Semana perfecta",
  xp_1000: "Mil puntos",
  study_10h: "Diez horas de estudio",
  workout_30: "30 entrenamientos",
  all_rounder: "Todoterreno",
  rank_despertado: "Rango: Despertado",
  rank_maestro: "Rango: Maestro",
  rank_santo: "Rango: Santo",
  rank_soberano: "Rango: Soberano",
  rank_espiritu: "Rango: Espíritu",
  rank_dios: "Rango: Dios",
};

export default function BadgeWatcher() {
  const [newBadges, setNewBadges] = useState<Array<{ code: string; name: string }>>([]);
  const [allCodes, setAllCodes] = useState<string[]>([]);

  const checkForNewBadges = useCallback(() => {
    supabase
      .from("badges")
      .select("code")
      .then(({ data }) => {
        const badges = (data ?? []) as Array<{ code: string }>;
        const currentCodes = badges.map((b) => b.code);
        setAllCodes(currentCodes);

        const stored = localStorage.getItem(SEEN_BADGES_KEY);
        if (stored === null) {
          // Primera visita: marcar todos como vistos, sin toasts
          localStorage.setItem(SEEN_BADGES_KEY, JSON.stringify(currentCodes));
          return;
        }

        let lastSeen: string[] = [];
        try {
          lastSeen = JSON.parse(stored);
        } catch {
          lastSeen = [];
        }

        const newOnes = currentCodes.filter((c) => !lastSeen.includes(c));
        if (newOnes.length > 0) {
          setNewBadges(newOnes.map((code) => ({
            code,
            name: BADGE_NAMES[code] || code,
          })));
        }
      });
  }, []);

  // Check on mount
  useEffect(() => {
    checkForNewBadges();
  }, [checkForNewBadges]);

  // Re-check when user returns to the webapp (visibilitychange)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        checkForNewBadges();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [checkForNewBadges]);

  const handleDismissAll = () => {
    localStorage.setItem(SEEN_BADGES_KEY, JSON.stringify(allCodes));
    setNewBadges([]);
  };

  if (newBadges.length === 0) return null;

  return <AchievementToast badges={newBadges} onDismissAll={handleDismissAll} />;
}
