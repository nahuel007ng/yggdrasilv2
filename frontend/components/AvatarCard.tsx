"use client";

const AVATAR_BY_TIER: Record<number, string> = {
  1: "⚔️",
  2: "🗡️",
  3: "🛡️",
  4: "👑",
  5: "🐉",
};

export interface AvatarCardProps {
  displayName: string | null;
  avatarLevel: number;
  currentLevel: number;
  streakShields: number;
}

export default function AvatarCard({
  displayName,
  avatarLevel,
  currentLevel,
  streakShields,
}: AvatarCardProps) {
  const safeTier = Math.min(Math.max(avatarLevel || 1, 1), 5);
  const emoji = AVATAR_BY_TIER[safeTier] ?? AVATAR_BY_TIER[1];

  return (
    <div className="pixel-card">
      <h3 className="pixel-card-title">Avatar</h3>
      <div className="flex flex-col items-center gap-3 py-3">
        <span
          className="text-6xl"
          aria-label={`Avatar tier ${safeTier}`}
          style={{ textShadow: "0 0 20px rgba(74, 158, 142, 0.3)" }}
        >
          {emoji}
        </span>
        <p className="text-pixel text-sm text-mana">Nivel {currentLevel}</p>
        {displayName && (
          <p className="text-[--color-text] text-center break-words max-w-full">
            {displayName}
          </p>
        )}
        {streakShields > 0 && (
          <p className="text-xp text-sm">🛡️ x{streakShields}</p>
        )}
      </div>
    </div>
  );
}
