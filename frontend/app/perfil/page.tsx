"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import AvatarCard from "@/components/AvatarCard";
import XPBar from "@/components/XPBar";
import StreaksPanel from "@/components/StreaksPanel";
import BadgesGrid from "@/components/BadgesGrid";
import StatsPanel from "@/components/StatsPanel";
import TitleSelector from "@/components/TitleSelector";

interface UserProfile {
  display_name: string | null;
  avatar_level: number;
  total_xp: number;
  current_level: number;
  streak_shields: number;
  active_title: string | null;
}

interface BadgeRow {
  code: string;
}

export default function PerfilPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [badgeCodes, setBadgeCodes] = useState<string[]>([]);
  const [titleCodes, setTitleCodes] = useState<{ code: string }[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(() => {
    supabase
      .from("user_profile")
      .select(
        "display_name, avatar_level, total_xp, current_level, streak_shields, active_title"
      )
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else if (data) setProfile(data as UserProfile);
        else
          setProfile({
            display_name: null,
            avatar_level: 1,
            total_xp: 0,
            current_level: 1,
            streak_shields: 0,
            active_title: null,
          });
      });
    supabase
      .from("badges")
      .select("code")
      .then(({ data, error }) => {
        if (!error && data) setBadgeCodes((data as BadgeRow[]).map((b) => b.code));
      });
    supabase
      .from("user_titles")
      .select("code, unlocked_at")
      .then(({ data, error }) => {
        if (!error && data) setTitleCodes(data as { code: string }[]);
      });
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Refetch when user returns to the tab (e.g., after using the bot)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchAll();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [fetchAll]);

  if (error) {
    return (
      <div className="pixel-card">
        <h2 className="pixel-card-title">Tu Perfil RPG</h2>
        <div className="pixel-border-error p-4">
          <p className="text-hp">Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="pixel-card">
        <h2 className="pixel-card-title">Tu Perfil RPG</h2>
        <p className="text-muted">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-gold">Tu Perfil RPG</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Columna izquierda: Avatar + Título + XP + Stats (apilados verticalmente) */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <AvatarCard
            displayName={profile.display_name}
            avatarLevel={profile.avatar_level}
            currentLevel={profile.current_level}
            streakShields={profile.streak_shields}
            activeTitle={profile.active_title}
          />
          <TitleSelector
            unlockedTitles={titleCodes}
            activeTitle={profile.active_title}
            onChanged={fetchAll}
          />
          <XPBar totalXp={profile.total_xp} currentLevel={profile.current_level} />
          <StatsPanel
            currentLevel={profile.current_level}
            badgeCodes={badgeCodes}
            titleCodes={titleCodes.map((t) => t.code)}
          />
        </div>

        {/* Columna derecha: Streaks + Logros (con scroll interno en desktop) */}
        <div className="lg:col-span-2 flex flex-col gap-4 lg:max-h-[calc(100vh-12rem)] lg:overflow-y-auto lg:pr-2">
          <StreaksPanel />
          <BadgesGrid
            unlockedTitles={titleCodes.map((t) => t.code)}
          />
        </div>
      </div>
    </div>
  );
}
