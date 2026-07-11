"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import AvatarCard from "@/components/AvatarCard";
import XPBar from "@/components/XPBar";
import StreaksPanel from "@/components/StreaksPanel";
import BadgesGrid from "@/components/BadgesGrid";

interface UserProfile {
  display_name: string | null;
  avatar_level: number;
  total_xp: number;
  current_level: number;
  streak_shields: number;
}

export default function PerfilPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("user_profile")
      .select(
        "display_name, avatar_level, total_xp, current_level, streak_shields"
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
          });
      });
  }, []);

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
        {/* Columna izquierda: Avatar + XP (apilados verticalmente) */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <AvatarCard
            displayName={profile.display_name}
            avatarLevel={profile.avatar_level}
            currentLevel={profile.current_level}
            streakShields={profile.streak_shields}
          />
          <XPBar totalXp={profile.total_xp} currentLevel={profile.current_level} />
        </div>

        {/* Columna derecha: Streaks + Logros (con scroll interno en desktop) */}
        <div className="lg:col-span-2 flex flex-col gap-4 lg:max-h-[calc(100vh-12rem)] lg:overflow-y-auto lg:pr-2">
          <StreaksPanel />
          <BadgesGrid />
        </div>
      </div>
    </div>
  );
}