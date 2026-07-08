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
    <div className="nes-container is-dark with-title">
      <p className="title">Avatar</p>
      <div className="flex flex-col items-center gap-2 py-2">
        <span className="text-6xl" aria-label={`Avatar tier ${safeTier}`}>
          {emoji}
        </span>
        <p className="nes-text is-primary text-base">Nivel {currentLevel}</p>
        {displayName && (
          <p className="text-white text-center break-words max-w-full">
            {displayName}
          </p>
        )}
        {streakShields > 0 && (
          <p className="nes-text is-success">🛡️ x{streakShields}</p>
        )}
      </div>
    </div>
  );
}