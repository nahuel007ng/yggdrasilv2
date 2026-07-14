"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import AchievementToast from "@/components/AchievementToast";
import { ACHIEVEMENTS_BY_CODE } from "@/lib/achievements";

const SEEN_BADGES_KEY = "seenBadgeCodes";

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
            name: ACHIEVEMENTS_BY_CODE[code]?.name || code,
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
