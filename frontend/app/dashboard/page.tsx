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

export default function DashboardPage() {
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
      <div className="nes-container is-dark with-title">
        <p className="title">Dashboard</p>
        <div className="nes-container is-error">
          <p className="text-white">Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="nes-container is-dark with-title">
        <p className="title">Dashboard</p>
        <p className="text-white">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AvatarCard
          displayName={profile.display_name}
          avatarLevel={profile.avatar_level}
          currentLevel={profile.current_level}
          streakShields={profile.streak_shields}
        />
        <XPBar
          totalXp={profile.total_xp}
          currentLevel={profile.current_level}
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1">
          <StreaksPanel />
        </div>
        <div className="lg:col-span-2">
          <BadgesGrid />
        </div>
      </div>
    </div>
  );
}