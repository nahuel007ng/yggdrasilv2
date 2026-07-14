"use client";

import AvatarHero from "@/components/AvatarHero";
import PixelIcon from "@/components/PixelIcon";
import { TITLES_BY_CODE } from "@/lib/achievements";

export interface AvatarCardProps {
  displayName: string | null;
  avatarLevel: number;
  currentLevel: number;
  streakShields: number;
  activeTitle?: string | null;
}

export default function AvatarCard({
  displayName,
  avatarLevel,
  currentLevel,
  streakShields,
  activeTitle,
}: AvatarCardProps) {
  const activeTitleDef = activeTitle ? TITLES_BY_CODE[activeTitle] : null;
  return (
    <div className="pixel-card">
      <h3 className="pixel-card-title">Avatar</h3>
      <div className="flex flex-col items-center gap-3 py-3">
        <AvatarHero
          avatarLevel={avatarLevel || 1}
          showRankName={true}
        />
        <p className="text-pixel text-sm text-mana">Nivel {currentLevel}</p>
        {displayName && (
          <p className="text-[--color-text] text-center break-words max-w-full">
            {displayName}
          </p>
        )}
        {activeTitleDef && (
          <p className={`text-pixel text-xs title-${activeTitleDef.rarity}`}>
            « {activeTitleDef.name} »
          </p>
        )}
        {streakShields > 0 && (
          <p className="text-xp text-sm flex items-center gap-1"><PixelIcon name="shield" size={16} /> x{streakShields}</p>
        )}
      </div>
    </div>
  );
}